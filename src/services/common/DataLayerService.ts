import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { DBService } from '../database';

import logger from '../../logger';
import {clear} from "../../utils";
const log = logger.module('CommonEntityService:main');

export interface ILogEventsService {
  database: DBService;
  dbCollectionPrefix: string;
  contractAddress: string;
  contractAbi: any[];
}

export class DataLayerService<T> {
  database: DBService;
  dbCollectionPrefix = 'entity';
  lastUpdate = 0;

  nodeURL = process.env.HMY_NODE_URL || 'https://api.s0.b.hmny.io';

  web3: Web3;
  contractAddress: string;
  contract: Contract;

  observableData: Map<string, T & { id: string }> = new Map();

  constructor(params: ILogEventsService) {
    this.database = params.database;
    this.dbCollectionPrefix = params.dbCollectionPrefix;

    this.web3 = new Web3(this.nodeURL);
    this.contractAddress = params.contractAddress;
    this.contract = new this.web3.eth.Contract(params.contractAbi, params.contractAddress);
  }

  updateOrCreateData = async (data: T & { id: string }) => {
    await this.database.update(
      `${this.dbCollectionPrefix}_data`,
      { id: data.id },
      {
        ...data,
        lastUpdate: Date.now(),
      }
    );
  };

  getInfo = async () => {
    const collectionName = `${this.dbCollectionPrefix}_data`;
    const total = await this.database.getCollectionCount(collectionName);

    return {
      total,
      lastUpdate: this.lastUpdate,
      dbCollectionPrefix: this.dbCollectionPrefix,
    };
  };

  loadAllData = async (): Promise<T[]> => {
    const collectionName = `${this.dbCollectionPrefix}_data`;
    const total = await this.database.getCollectionCount(collectionName);

    return await this.database.getCollectionData(
      collectionName,
      { ['lastUpdate']: -1 },
      Number(total),
      0
    );
  };

  getData = async (params: {
    id?: string;
    size: number;
    page: number;
    filter?: Record<string, any>;
    sort?: Record<string, any>;
  }) => {
    const collectionName = `${this.dbCollectionPrefix}_data`;

    const from = params.page * params.size;

    const filter = params.filter && clear(params.filter);

    const total = await this.database.getCollectionCount(collectionName, filter);

    const data = await this.database.getCollectionData(
      collectionName,
      params.sort,
      Number(params.size),
      from,
      params.id ? { id: params.id } : filter
    );

    return {
      content: data,
      totalElements: total,
      totalPages: Math.ceil(total / params.size),
      size: params.size,
      page: params.page,
    };
  };

  find = async (id: string) => {
    const collectionName = `${this.dbCollectionPrefix}_data`;
    return await this.database.find(collectionName, { id });
  };
}
