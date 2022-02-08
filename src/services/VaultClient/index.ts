import EventEmitter = require('events');
import {
  CONTRACT_EVENT,
  DataLayerService,
  ILogEventsService,
  IssueRequestEvent,
  RedeemRequest,
} from '../common';
import { IServices } from '../init_vault';
import { IOperationInitParams, Operation } from './Operation';
import { OPERATION_TYPE, STATUS } from './interfaces';
import { WalletBTC } from './WalletBTC';
import { HmyContractManager } from '../../harmony/HmyContractManager';
import logger from '../../logger';
import { bn } from '../../utils';
import { Buffer } from 'buffer';
import axios from 'axios';
import {checkAndInitDbPrivateKeys} from "./load-keys/database";
import {loadKey, WALLET_TYPE} from "./load-keys";
import { createError } from "../../routes/helpers";

const bitcoin = require('bitcoinjs-lib');

const log = logger.module('VaultClient:main');

export interface IVaultClient extends ILogEventsService {
  eventEmitter: EventEmitter;
  services: IServices;
}

enum RELAYER_STATUS {
  STOPPED = 'STOPPED',
  LAUNCHED = 'LAUNCHED',
  PAUSED = 'PAUSED',
}

export class VaultClient extends DataLayerService<IOperationInitParams> {
  eventEmitter: EventEmitter;

  hmyContractManager: HmyContractManager;

  services: IServices;

  operations: Operation[] = [];

  waitInterval = Number(process.env.WAIT_INTERVAL) || 1000;
  walletBTC: WalletBTC;

  status = RELAYER_STATUS.STOPPED;

  constructor(params: IVaultClient) {
    super(params);

    this.services = params.services;
    this.eventEmitter = params.eventEmitter;
  }

  async start() {
    try {
      if (process.env.VAULT_CLIENT_WALLET === WALLET_TYPE.DATABASE) {
        await checkAndInitDbPrivateKeys(this.services.vaultDbSettings);
      }

      const hmyPrivateKey = await loadKey({
        awsKeyFile: 'hmy-secret',
        envKey: 'HMY_VAULT_PRIVATE_KEY',
        dbKey: 'hmyPrivateKey',
        name: 'Harmony',
        services: this.services,
      });

      const btcPrivateKey = await loadKey({
        awsKeyFile: 'btc-secret',
        envKey: 'BTC_VAULT_PRIVATE_KEY',
        dbKey: 'btcPrivateKey',
        name: 'BTC',
        services: this.services,
      });

      this.hmyContractManager = new HmyContractManager({
        contractAddress: this.contractAddress,
        contractAbi: this.contractAbi,
        nodeUrl: process.env.HMY_NODE_URL,
        database: this.services.database,
      });

      await this.hmyContractManager.init(hmyPrivateKey);

      this.walletBTC = new WalletBTC({
        services: this.services,
        vaultId: this.hmyContractManager.masterAddress,
      });

      await this.walletBTC.init(btcPrivateKey);

      this.eventEmitter.on(`ADD_${CONTRACT_EVENT.RedeemRequest}`, this.addRedeem);

      this.status = RELAYER_STATUS.LAUNCHED;

      setInterval(this.pingDashboard, 30000);

      log.info(`Start Vault Client - ok`);

      await this.loadOperationsFromDB();
    } catch (e) {
      log.error(`Start Vault Client - failed`, { error: e });
      // throw new Error(`Start Vault Client: ${e.message}`);
    }
  }

  isCorrectVault = (vaultId: string) =>
    vaultId.toLowerCase() === this.hmyContractManager.masterAddress.toLowerCase();

  onIssueRequest = async (data: IssueRequestEvent) => {
    if (this.isCorrectVault(data.returnValues.vaultId)) {
    }
  };

  saveOperationToDB = async (operation: Operation) => {
    return await this.updateOrCreateData(operation.toObject({ payload: true }));
  };

  loadOperationsFromDB = async () => {
    const res = await this.getData({
      size: 1000,
      page: 0,
      // filter: { status: 'in_progress' },
      sort: { timestamp: -1 },
    });

    res.content.forEach(params => {
      log.info('Restore operation', {
        id: params.id,
        type: params.type,
        btcAddress: params.btcAddress,
        vault: params.vault,
        requester: params.requester,
        amount: params.amount,
      });

      const operation = new Operation();

      operation.asyncConstructor(
        params,
        this.saveOperationToDB,
        this.walletBTC,
        this.hmyContractManager
      );

      this.operations.push(operation);
    });
  };

  resetOperation = async (id: string) => {
    const operation = this.operations.find(o => o.id === id);

    if (operation && operation.status === STATUS.ERROR) {
      const newOperationObj: any = operation.toObject({ payload: true });

      newOperationObj.status = STATUS.IN_PROGRESS;
      newOperationObj.wasRestarted = newOperationObj.wasRestarted
        ? Number(newOperationObj.wasRestarted) + 1
        : 1;

      newOperationObj.actions = newOperationObj.actions.map(a => ({
        ...a,
        status: STATUS.WAITING,
      }));

      this.operations = this.operations.filter(o => o.id !== id);

      const newOperation = new Operation();

      await newOperation.asyncConstructor(
        {
          ...newOperationObj,
        },
        this.saveOperationToDB,
        this.walletBTC,
        this.hmyContractManager
      );
  
      await this.saveOperationToDB(newOperation);

      this.operations.push(newOperation);

      return newOperation.toObject();
    } else {
      throw createError(404, 'Operation not found');
    }
  };

  createOperation = async (params: IOperationInitParams) => {
    if (this.operations.find(o => o.id === params.id)) {
      // log.error('Operation already created', { params });
      return;
    }

    log.info('Start new operation', { params });

    const operation = new Operation();

    await operation.asyncConstructor(
      {
        id: params.id,
        type: params.type,
        btcAddress: params.btcAddress,
        vault: params.vault,
        requester: params.requester,
        amount: params.amount,
      },
      this.saveOperationToDB,
      this.walletBTC,
      this.hmyContractManager
    );

    await this.saveOperationToDB(operation);

    this.operations.push(operation);

    return operation.toObject();
  };

  addRedeem = async (redeem: RedeemRequest) => {
    if (this.isCorrectVault(redeem.vault) && redeem.status === '1') {
      await this.createOperation({
        id: redeem.id,
        type: OPERATION_TYPE.REDEEM,
        vault: redeem.vault,
        requester: redeem.requester,
        btcAddress: redeem.btcAddress,
        amount: redeem.amountBtc,
      });
    }
  };

  info = async () => {
    const operations = await this.getInfo();

    const eventsInfo = await this.services.onebtcEvents.getInfo();
    const synchronized = parseInt(eventsInfo.progress) === 1;

    const vault = await this.hmyContractManager.getVaultInfo();

    const balances = await this.walletBTC.getBalances();

    return {
      synchronized,
      syncProgress: eventsInfo.progress,
      registered: !!vault,
      status: this.status,
      vaultAddress: this.hmyContractManager.masterAddress,
      vaultInfo: vault,
      contract: this.contractAddress,
      balances,
      operations,
      relayer: {
        isRelayerSynced: this.services.relayerClient.isSynced(),
        status: String(this.services.relayerClient.status),
        currentBtcHeight: this.services.relayerClient.btcLastBlock,
        nodeBtcHeight: this.services.relayerClient.nodeLastBlock,
        contract: this.services.relayerClient.relayContractAddress,
      },
    };
  };

  register = async (collateral: string) => {
    const vaultEcPair = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(this.walletBTC.btcPrivateKey, 'hex'),
      { compressed: false }
    );

    const pubX = bn(vaultEcPair.publicKey.slice(1, 33));
    const pubY = bn(vaultEcPair.publicKey.slice(33, 65));

    return await this.hmyContractManager.register(collateral, pubX, pubY);
  };

  pingDashboard = async () => {
    try {
      await axios.post(`${process.env.DASHBOARD_URL}/monitor/ping`, {
        vault: this.hmyContractManager.masterAddress,
      });
    } catch (e) {
      // log.error('Error ping dashboard', { error: e });
    }
  };
}
