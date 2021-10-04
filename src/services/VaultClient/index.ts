import EventEmitter = require('events');
import {
  CONTRACT_EVENT,
  DataLayerService,
  ILogEventsService,
  IssueRequestEvent,
  RedeemRequest,
} from '../common';
import { IServices } from '../init';
import { IOperationInitParams, Operation } from './Operation';
import { OPERATION_TYPE } from './interfaces';
import { WalletBTC } from './WalletBTC';
import { HmyContractManager } from '../../harmony/HmyContractManager';

import logger from '../../logger';
const log = logger.module('VaultClient:main');

export interface IVaultClient extends ILogEventsService {
  eventEmitter: EventEmitter;
  services: IServices;
}

export class VaultClient extends DataLayerService<IOperationInitParams> {
  eventEmitter: EventEmitter;

  hmyContractManager: HmyContractManager;

  services: IServices;

  operations: Operation[] = [];

  waitInterval = Number(process.env.WAIT_INTERVAL) || 1000;
  walletBTC: WalletBTC;

  constructor(params: IVaultClient) {
    super(params);

    this.services = params.services;
    this.eventEmitter = params.eventEmitter;
  }

  async start() {
    try {
      if (process.env.HMY_VAULT_PRIVATE_KEY) {
        this.hmyContractManager = new HmyContractManager({
          hmyPrivateKey: process.env.HMY_VAULT_PRIVATE_KEY,
          contractAddress: this.contractAddress,
          contractAbi: this.contractAbi,
          nodeUrl: process.env.HMY_NODE_URL,
        });
      } else {
        throw new Error('HMY_VAULT_PRIVATE_KEY not found');
      }

      if (process.env.BTC_VAULT_PRIVATE_KEY) {
        this.walletBTC = new WalletBTC({
          services: this.services,
          vaultId: this.hmyContractManager.masterAddress,
          btcPrivateKey: process.env.BTC_VAULT_PRIVATE_KEY,
        });
      } else {
        throw new Error('BTC_VAULT_PRIVATE_KEY not found');
      }

      this.eventEmitter.on(`ADD_${CONTRACT_EVENT.RedeemRequest}`, this.addRedeem);

      log.info(`Start Vault Client - ok`);
    } catch (e) {
      log.error(`Start Vault Client - failed`, { error: e });
      // throw new Error(`Start Vault Client: ${e.message}`);
    }
  }

  isClientVault = (vaultId: string) =>
    vaultId.toLowerCase() === this.hmyContractManager.masterAddress.toLowerCase();

  onIssueRequest = async (data: IssueRequestEvent) => {
    if (this.isClientVault(data.returnValues.vaultId)) {
    }
  };

  saveOperationToDB = async (operation: Operation) => {
    return await this.updateOrCreateData(operation.toObject({ payload: true }));
  };

  validateOperationBeforeCreate = async (params: IOperationInitParams) => {
    if (this.operations.find(o => o.id === params.id)) {
      log.error('Operation already created', { params });
      throw new Error('This operation already created');
    }
  };

  createOperation = async (params: IOperationInitParams) => {
    await this.validateOperationBeforeCreate(params);

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
    if (this.isClientVault(redeem.vault) && redeem.status === '1') {
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
}
