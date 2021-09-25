import Web3 from 'web3';

import { DBService } from '../database';
import { getContractDeploymentBlock, getEvent, getHmyLogs } from './api';

import logger from '../../logger';
const log = logger.module('logEvents:main');

export interface IRegistrationService {
  database: DBService;
  dbCollectionName: string;
  contractAddress: string;
  contractAbi: any;
  eventName: string;
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

export class LogEvents {
  database: DBService;

  dbCollectionName = 'logEvents';

  events: any[] = [];

  lastBlock = 0;
  lastSuccessfulRead = 0;
  contractAddress = '';

  blocksInterval = Number(process.env.BLOCKS_INTERVAL) || 10000;
  waitInterval = Number(process.env.WAIT_INTERVAL) || 500;
  cacheLimit = Number(process.env.CACHE_LIMIT) || 10000;
  topicAddress = '';

  contractAbi = [];
  eventLogs = [];
  eventName = '';

  web3: Web3;
  contract;

  nodeURL = process.env.HMY_NODE_URL || 'https://api.s0.b.hmny.io';

  constructor(params: IRegistrationService) {
    this.database = params.database;

    this.web3 = new Web3(this.nodeURL);

    this.dbCollectionName = params.dbCollectionName;
    this.contractAddress = params.contractAddress;
    // this.lastBlock = params.lastBlock;
    // this.eventLogs = params.eventLogs;
    this.contractAbi = params.contractAbi;
    this.eventName = params.eventName;

    this.topicAddress = getEvent(this.web3, this.contractAbi, this.eventName).signature;
  }

  async start() {
    try {
      this.lastBlock = await getContractDeploymentBlock(this.contractAddress);

      setTimeout(this.readEvents, 100);
    } catch (e) {
      log.error(`Start ${this.eventName}`, { error: e });
      throw new Error(`start ${this.eventName}: ${e.message}`);
    }
  }

  readEvents = async () => {
    try {
      const latest = await this.web3.eth.getBlockNumber();

      if (latest > this.lastBlock) {
        const from = this.lastBlock;
        const to = from + this.blocksInterval > latest ? latest : from + this.blocksInterval;

        const res = await getHmyLogs({
          fromBlock: '0x' + from.toString(16),
          toBlock: '0x' + to.toString(16),
          address: this.contractAddress,
          topics: [this.topicAddress],
        });

        this.eventLogs = this.eventLogs.concat(res.result);

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

  // restoreOperationsFromDB = async () => {
  //   this.registrations = await this.database.getCollectionDataWithLimit(
  //     this.dbCollectionName,
  //     'timestamp',
  //     this.cacheLimit
  //   );
  // };

  getInfo = () => {
    return {
      totalLogs: this.eventLogs.length,
      lastBlock: this.lastBlock,
      lastSuccessfulRead: this.lastSuccessfulRead,
      blocksInterval: this.blocksInterval,
      dbCollectionName: this.dbCollectionName,
      contractAddress: this.contractAddress,
      eventName: this.eventName,
      waitInterval: this.waitInterval,
      topicAddress: this.topicAddress,
    };
  };

  getAllEvents = (params: { search?: string; size: number; page: number }) => {
    // const filteredData = this.eventLogs.filter(log => {
    //   if (params.search) {
    //     if (
    //       log.domain.includes(params.search) ||
    //       (log.twitter && log.twitter.includes(params.search))
    //     )
    //       return true;
    //
    //     try {
    //       const searchAddress = this.hmy.crypto.getAddress(params.search).checksum;
    //
    //       return (
    //         this.hmy.crypto.getAddress(log.owner).checksum === searchAddress ||
    //         this.hmy.crypto.getAddress(log.from).checksum === searchAddress
    //       );
    //     } catch (e) {
    //       // console.log(e);
    //     }
    //
    //     return false;
    //   }
    //
    //   return true;
    // });
    //
    // const sortedData = filteredData.sort((a, b) => {
    //   return moment(a.timestamp * 1000).isBefore(b.timestamp * 1000) ? 1 : -1;
    // });

    const filteredData = this.eventLogs;
    const sortedData = filteredData;

    const from = params.page * params.size;
    const to = (params.page + 1) * params.size;
    const paginationData = sortedData.slice(from, Math.min(to, filteredData.length));

    return {
      content: paginationData,
      totalElements: filteredData.length,
      totalPages: Math.ceil(filteredData.length / params.size),
      size: params.size,
      page: params.page,
    };
  };
}
