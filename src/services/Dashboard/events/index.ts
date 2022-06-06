import Web3 from 'web3';
import { AbiItem } from 'web3-utils/types';
import { DBService } from '../../database';
import { 
  getContractDeploymentBlock, 
  getEventsAbi, 
  getHmyLogs,
  getHmyTransactionReceipt,
  getHmyTransactionByHash 
} from './api';
import EventEmitter = require('events');
import { IEvent } from '../../common';
import { rpcErrorMessage } from '../../../harmony/helpers';

import logger from '../../../logger';
const log = logger.module('logEvents:main');

export interface ILogEventsService {
  database: DBService;
  contractAddress: string;
  contractAbi: any[];
  dbCollectionPrefix: string;
  eventEmitter: EventEmitter;
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

export class LogEvents {
  database: DBService;

  dbCollectionPrefix = 'events';

  events: any[] = [];

  lastBlock = 0;
  lastNodeBlock = 0;
  startBlock = 0;
  lastSuccessfulRead = 0;
  contractAddress = '';

  blocksInterval = Number(process.env.BLOCKS_INTERVAL) || 1024;
  waitInterval = Number(process.env.WAIT_INTERVAL) || 500;
  cacheLimit = Number(process.env.CACHE_LIMIT) || 10000;

  abiEvents: Record<string, AbiItem>;
  contractAbiEvents: any[];
  eventLogs = [];
  eventName = '';
  eventEmitter: EventEmitter;

  web3: Web3;

  nodeURL = process.env.HMY_NODE_URL || 'https://api.s0.b.hmny.io';

  constructor(params: ILogEventsService) {
    this.database = params.database;

    this.web3 = new Web3(this.nodeURL);

    this.dbCollectionPrefix = params.dbCollectionPrefix;
    this.contractAddress = params.contractAddress;
    // this.lastBlock = params.lastBlock;
    // this.eventLogs = params.eventLogs;
    this.abiEvents = getEventsAbi(this.web3, params.contractAbi);
    this.eventEmitter = params.eventEmitter;
  }

  async start() {
    try {
      this.lastBlock = await getContractDeploymentBlock(this.contractAddress);
      this.startBlock = this.lastBlock;
      // this.lastBlock = 22740000; // 02.09.2022 - launch date

      this.lastNodeBlock = await this.web3.eth.getBlockNumber();
      const defStartBlock = Number(this.lastNodeBlock) - 250000;

      const req = await this.getAllEvents({ size: 1, page: 0, sort: { blockNumber: -1 } });

      if (req.content.length) {
        this.lastBlock = req.content[0].blockNumber;
        // this.lastBlock = Number(this.lastBlock) - 250000; // reload last 5 days on restart
        this.lastBlock = Number(this.lastBlock) - 100000; // reload last 2 days on restart
      }

      this.lastBlock = Math.max(this.lastBlock, defStartBlock);
      this.startBlock = this.lastBlock;

      setTimeout(this.readEvents, 100);

      log.info(`Start Event Service ${this.dbCollectionPrefix} - ok`, {
        lastBlock: this.lastBlock,
        startBlock: this.startBlock,
      });
    } catch (e) {
      log.error(`Start ${this.dbCollectionPrefix}`, { error: e });
      throw new Error(`start ${this.dbCollectionPrefix}: ${e.message}`);
    }
  }

  addIfNotFoundMany = async (events: IEvent[]) => {
    for (let i = 0; i < events.length; i++) {
      const collectionName = `${this.dbCollectionPrefix}_data`;

      const dbEvent = await this.database.find(collectionName, {
        transactionHash: events[i].transactionHash,
        data: events[i].data,
      });

      if (!dbEvent) {
        await this.database.insert(collectionName, events[i]);
      }
    }
  };

  readEvents = async () => {
    try {
      this.lastNodeBlock = await this.web3.eth.getBlockNumber();

      if (this.lastNodeBlock > this.lastBlock) {
        const from = this.lastBlock;
        const to =
          from + this.blocksInterval > this.lastNodeBlock
            ? this.lastNodeBlock
            : from + this.blocksInterval;

        const res = await getHmyLogs({
          fromBlock: '0x' + from.toString(16),
          toBlock: '0x' + to.toString(16),
          address: this.contractAddress,
          // topics: ['0x0279f22d36b78c19957d9d6d792e3625dfb99d644e30be9a850aab76b63b2594'],
        });

        const events = [];

        for (let i = 0; i < res.result.length; i++) {
          const item = res.result[i];
          const topic = item.topics[0].toLowerCase();
          const abiItem = this.abiEvents[topic];

          if (abiItem) {
            const returnValues = this.web3.eth.abi.decodeLog(
              abiItem.inputs,
              item.data,
              item.topics.slice(1)
            );

            events.push({
              ...item,
              name: abiItem.name,
              returnValues,
              blockNumber: Number(item.blockNumber),
            });
          }
        }

        if (events.length) {
          // save events to DB
          await this.addIfNotFoundMany(events);

          // send events to other services via eventsEmitter
          events.forEach(event => this.eventEmitter.emit(event.name, event));
        }

        // cache - disabled
        this.events = this.eventLogs.concat(events);

        this.lastBlock = to;
        this.lastSuccessfulRead = Date.now();

        // console.log('Last block: ', this.lastBlock);
      } else {
        await sleep(20);
      }
    } catch (e) {
      log.error('Error getEvents', { error: e });
    }

    setTimeout(this.readEvents, this.waitInterval);
  };

  getTransactionReceipt = async txnHash => {
    try {
      const res: any = await getHmyTransactionReceipt(txnHash);

      if (!res) {
        return res;
      }

      const txInfoRes = await getHmyTransactionByHash(txnHash);

      return {
        ...res,
        ...txInfoRes,
        status: res.status === 1,
        hash: txInfoRes?.hash || res.transactionHash,
      };
    } catch (e) {
      if (rpcErrorMessage(e)) {
        log.error('getTransactionReceipt exception rpcErrorMessage', { txnHash, error: e });

        await sleep(10000);

        return await this.getTransactionReceipt(txnHash);
      } else {
        throw e;
      }
    }
  };

  getEventsFromLogs = (logs: any[]) => {
    const events = [];

    for (let i = 0; i < logs.length; i++) {
      const item = logs[i];
      const topic = item.topics[0].toLowerCase();
      const abiItem = this.abiEvents[topic];

      if (abiItem) {
        const returnValues = this.web3.eth.abi.decodeLog(
          abiItem.inputs,
          item.data,
          item.topics.slice(1)
        );

        events.push({
          ...item,
          name: abiItem.name,
          returnValues,
          blockNumber: Number(item.blockNumber),
        });
      }
    }

    return events;
  }

  addEventFromTx= async (hash: string) => {
    const tx = await this.getTransactionReceipt(hash);
    
    if(!tx) {
      return false;
    }

    const events = this.getEventsFromLogs(tx.logs);

    if (events.length) {
      // save events to DB
      await this.addIfNotFoundMany(events);

      // send events to other services via eventsEmitter
      events.forEach(event => this.eventEmitter.emit(event.name, event));
    }

    return events;
  }

  getProgress = () =>
    ((this.lastBlock - this.startBlock) / (this.lastNodeBlock - this.startBlock)).toFixed(2);

  getInfo = async () => {
    const collectionName = `${this.dbCollectionPrefix}_data`;
    const total = await this.database.getCollectionCount(collectionName);

    return {
      totalLogs: total,
      progress: this.getProgress(),
      lastBlock: this.lastBlock,
      lastNodeBlock: this.lastNodeBlock,
      lastSuccessfulRead: this.lastSuccessfulRead,
      blocksInterval: this.blocksInterval,
      dbCollectionPrefix: this.dbCollectionPrefix,
      contractAddress: this.contractAddress,
      waitInterval: this.waitInterval,
    };
  };

  getAllEvents = async (params: {
    search?: string;
    size: number;
    page: number;
    sort?: Record<string, any>;
  }) => {
    const collectionName = `${this.dbCollectionPrefix}_data`;

    const from = params.page * params.size;

    const total = await this.database.getCollectionCount(collectionName);

    const data = await this.database.getCollectionData(
      collectionName,
      params.sort,
      Number(params.size),
      from
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
