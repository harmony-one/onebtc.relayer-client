import Web3 from 'web3';
import { DBService } from '../database';
import { abi } from '../../abi/Oracle';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
const BN = require('bn.js');
import axios from 'axios';

import logger from '../../logger';
const log = logger.module('oracle:Service');

export interface IOracleClient {
  database: DBService;
  dbCollectionName: string;
  oracleContractAddress: string;
}

enum ORACLE_STATUS {
  STOPPED = 'STOPPED',
  LAUNCHED = 'LAUNCHED',
  PAUSED = 'PAUSED',
}

export class OracleClient {
  database: DBService;
  dbCollectionName = 'oracle';

  web3: Web3;
  ethMasterAccount: string;
  oracleContract: Contract;
  oracleContractAddress: string;

  lastPrice = {
    btcPrice: 0,
    onePrice: 0,
  };

  syncInterval = 20000;
  status = ORACLE_STATUS.STOPPED;
  lastError = '';

  constructor(params: IOracleClient) {
    this.database = params.database;
    this.dbCollectionName = params.dbCollectionName;

    this.web3 = new Web3(process.env.HMY_NODE_URL);

    this.oracleContractAddress = params.oracleContractAddress;
  }

  async start() {
    try {
      if (process.env.HMY_ORACLE_PRIVATE_KEY) {
        let ethMasterAccount = this.web3.eth.accounts.privateKeyToAccount(
          process.env.HMY_ORACLE_PRIVATE_KEY
        );

        this.web3.eth.accounts.wallet.add(ethMasterAccount);
        this.web3.eth.defaultAccount = ethMasterAccount.address;
        this.ethMasterAccount = ethMasterAccount.address;

        this.oracleContract = new this.web3.eth.Contract(
          abi as AbiItem[],
          this.oracleContractAddress
        );
      } else {
        throw new Error('HMY_ORACLE_PRIVATE_KEY not found');
      }

      log.info(`Start Oracle Service - ok`);

      setTimeout(this.syncPrice, 100);
    } catch (e) {
      log.error('Start Oracle Service - failed', { error: e });
      // this.lastError = e && e.message;
    }
  }

  syncPrice = async () => {
    try {
      let res = await axios.get('https://api.binance.com/api/v1/ticker/price?symbol=BTCUSDT');
      const btcPrice = res.data.price;
      res = await axios.get('https://api.binance.com/api/v1/ticker/price?symbol=ONEUSDT');
      const onePrice = res.data.price;

      const oldPrice = this.lastPrice.btcPrice ? (this.lastPrice.onePrice / this.lastPrice.btcPrice) : 0;
      const delta = oldPrice / 200;
      
      const newPrice = (onePrice / btcPrice);
      
      if(Math.abs(newPrice - oldPrice) > delta) {
        await this.oracleContract.methods
          .setExchangeRate(new BN(btcPrice * 1e8), new BN(onePrice * 1e8))
          .send({
            from: this.ethMasterAccount,
            gas: process.env.HMY_GAS_LIMIT,
            gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
          });

        this.lastPrice = {
          btcPrice,
          onePrice,
        };
      }
    } catch (e) {
      log.error('Error to syncPrice', { error: e, exchangeRate: this.lastPrice });
      this.lastError = e && e.message;
    }

    setTimeout(this.syncPrice, this.syncInterval);
  };

  getLastPrice = () => this.lastPrice;

  getInfo = () => ({
    lastPrice: this.lastPrice,
    status: this.status,
    lastError: this.lastError,
    oracleContractAddress: this.oracleContractAddress,
    network: process.env.NETWORK,
    btcNodeUrl: process.env.BTC_NODE_URL,
    hmyNodeUrl: process.env.HMY_NODE_URL,
  });
}
