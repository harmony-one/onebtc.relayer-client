import EventEmitter = require('events');
import { DBService } from '../database';

import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { IRegisterVault } from '../interfaces';

import logger from '../../logger';
const log = logger.module('Vaults:main');

export interface ILogEventsService {
  database: DBService;
  dbCollectionPrefix: string;
  eventEmitter: EventEmitter;
  contractAddress: string;
  contractAbi: any[];
}

export interface IVaultRegistry {
  vaultId: string;
  btcPublicKeyX: string;
  btcPublicKeyY: string;
  collateral: string;
  issued: string;
  toBeIssued: string;
  toBeRedeemed: string;
  replaceCollateral: string;
  toBeReplaced: string;
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

export class VaultsService {
  database: DBService;

  dbCollectionPrefix = 'vaults';
  contractAddress: string;

  vaults: IVaultRegistry[] = [];
  lastUpdate = 0;

  waitInterval = Number(process.env.WAIT_INTERVAL) || 500;
  cacheLimit = Number(process.env.CACHE_LIMIT) || 10000;

  eventEmitter: EventEmitter;

  web3: Web3;
  vaultContract: Contract;
  nodeURL = process.env.HMY_NODE_URL || 'https://api.s0.b.hmny.io';

  constructor(params: ILogEventsService) {
    this.database = params.database;

    this.dbCollectionPrefix = params.dbCollectionPrefix;

    this.web3 = new Web3(this.nodeURL);
    this.contractAddress = params.contractAddress;
    this.vaultContract = new this.web3.eth.Contract(params.contractAbi, params.contractAddress);

    this.eventEmitter = params.eventEmitter;
    this.eventEmitter.on('RegisterVault', this.addVault);
  }

  async start() {
    try {
      log.info(`Start Vaults Service - ok`);

      this.vaults = await this.loadAllData();

      setTimeout(this.syncVaults, 100);
    } catch (e) {
      log.error(`Start Vault`, { error: e });
      throw new Error(`Start Vault: ${e.message}`);
    }
  }

  updateOrCreateVault = async (data: IVaultRegistry) => {
    await this.database.update(
      `${this.dbCollectionPrefix}_data`,
      { vaultId: data.vaultId },
      {
        ...data,
        lastUpdate: Date.now(),
      }
    );
  };

  addVault = async (data: IRegisterVault) => {
    try {
      if (!this.vaults.find(v => v.vaultId === data.returnValues.vaultId)) {
        const vault = {
          ...data.returnValues,
          issued: '0',
          toBeIssued: '0',
          toBeRedeemed: '0',
          replaceCollateral: '0',
          toBeReplaced: '0',
        };

        this.vaults.push(vault);

        await this.updateOrCreateVault(vault);
      }
    } catch (e) {
      log.error(`Error addVault`, { error: e, data });
    }
  };

  syncVaults = async () => {
    try {
      for (let i = 0; i < this.vaults.length; i++) {
        const vault = this.vaults[i];

        try {
          const vaultInfo = await this.vaultContract.methods.vaults(vault.vaultId).call();

          this.vaults[i] = { ...vaultInfo, vaultId: vault.vaultId };

          await this.updateOrCreateVault(this.vaults[i]);
        } catch (e) {
          log.error('Error update Vault', { error: e, vault });
        }
      }
    } catch (e) {
      log.error('Error syncVaults', { error: e });
    }

    setTimeout(this.syncVaults, this.waitInterval);
  };

  getInfo = async () => {
    const collectionName = `${this.dbCollectionPrefix}_data`;
    const total = await this.database.getCollectionCount(collectionName);

    return {
      total,
      lastUpdate: this.lastUpdate,
      dbCollectionPrefix: this.dbCollectionPrefix,
      waitInterval: this.waitInterval,
    };
  };

  loadAllData = async () => {
    const collectionName = `${this.dbCollectionPrefix}_data`;
    const total = await this.database.getCollectionCount(collectionName);

    return await this.database.getCollectionData(collectionName, 'lastUpdate', Number(total), 0);
  };

  getAllData = async (params: { id?: string; size: number; page: number }) => {
    const collectionName = `${this.dbCollectionPrefix}_data`;

    const from = params.page * params.size;

    const total = await this.database.getCollectionCount(collectionName);

    const data = await this.database.getCollectionData(
      collectionName,
      'blockNumber',
      Number(params.size),
      from,
      params.id ? { vaultId: params.id } : null
    );

    return {
      content: data,
      totalElements: total,
      totalPages: Math.ceil(total / params.size),
      size: params.size,
      page: params.page,
    };
  };
}
