import Web3 from 'web3';
import { DBService } from '../database';
import { abi } from '../../abi/Relay';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getBlockByHeight, getHeight } from '../../bitcoin/rpc';
const BN = require('bn.js');

import logger from '../../logger';
import { sleep } from '../../utils';
const log = logger.module('relay:Service');

export interface IRelayerClient {
  database: DBService;
  dbCollectionName: string;
  relayContractAddress: string;
  readonly?: boolean;
}

enum RELAYER_STATUS {
  STOPPED = 'STOPPED',
  LAUNCHED = 'LAUNCHED',
  PAUSED = 'PAUSED',
}

export class RelayerClient {
  database: DBService;
  dbCollectionName = 'headers';
  readonly = false;

  web3: Web3;
  ethMasterAccount: string;
  relayContract: Contract;
  relayContractAddress: string;

  btcLastBlock: number;
  nodeLastBlock: number;

  status = RELAYER_STATUS.STOPPED;
  lastError = '';

  constructor(params: IRelayerClient) {
    this.database = params.database;
    this.dbCollectionName = params.dbCollectionName;

    this.web3 = new Web3(process.env.HMY_NODE_URL);

    this.relayContractAddress = params.relayContractAddress;
    this.readonly = params.readonly || false;
  }

  async start() {
    try {
      if (this.readonly) {
        this.relayContract = new this.web3.eth.Contract(
          abi as AbiItem[],
          this.relayContractAddress
        );

        const res = await this.relayContract.methods.getBestBlock().call();
        this.btcLastBlock = Number(res.height);
      } else if (process.env.HMY_RELAY_PRIVATE_KEY) {
        let ethMasterAccount = this.web3.eth.accounts.privateKeyToAccount(
          process.env.HMY_RELAY_PRIVATE_KEY
        );

        this.web3.eth.accounts.wallet.add(ethMasterAccount);
        this.web3.eth.defaultAccount = ethMasterAccount.address;
        this.ethMasterAccount = ethMasterAccount.address;

        this.relayContract = new this.web3.eth.Contract(
          abi as AbiItem[],
          this.relayContractAddress
        );

        const res = await this.relayContract.methods.getBestBlock().call();
        this.btcLastBlock = Number(res.height);
      } else {
        throw new Error('HMY_RELAY_PRIVATE_KEY not found');
      }

      log.info(`Start Relayer Service - ok`, { height: this.btcLastBlock });

      this.status = RELAYER_STATUS.LAUNCHED;

      if (this.readonly) {
        setTimeout(this.readLastSyncedBlock, 100);
      } else {
        setTimeout(this.syncBlockHeader, 100);
      }
    } catch (e) {
      log.error('Start Relayer Service - failed', { error: e });
      // this.lastError = e && e.message;
    }
  }

  readLastSyncedBlock = async () => {
    try {
      const res = await this.relayContract.methods.getBestBlock().call();
      this.btcLastBlock = Number(res.height);
      this.nodeLastBlock = await getHeight();
    } catch (e) {
      log.error('Error to readLastSyncedBlock', { error: e, btcLastBlock: this.btcLastBlock });
      this.lastError = e && e.message;

      await sleep(process.env.SYNC_INTERVAL);
    }

    setTimeout(this.readLastSyncedBlock, Number(process.env.SYNC_INTERVAL));
  };

  syncBlockHeader = async () => {
    try {
      const btcHeight = await getHeight();
      if (btcHeight > this.btcLastBlock) {
        const block = await getBlockByHeight(this.btcLastBlock + 1);

        await this.relayContract.methods.submitBlockHeader('0x' + block.toHex(true)).send({
          from: this.ethMasterAccount,
          gas: process.env.HMY_GAS_LIMIT,
          gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
        });

        this.btcLastBlock = this.btcLastBlock + 1;

        // console.log(`${this.btcLastBlock}/${btcHeight}`, 'synced');
      } else {
        await sleep(process.env.SYNC_INTERVAL);
      }
    } catch (e) {
      log.error('Error to get new Header', { error: e, btcLastBlock: this.btcLastBlock });
      this.lastError = e && e.message;

      const res = await this.relayContract.methods.getBestBlock().call();
      this.btcLastBlock = Number(res.height);

      await sleep(process.env.SYNC_INTERVAL);
    }

    setTimeout(this.syncBlockHeader, 100);
  };

  getLastRelayBlock = () => this.btcLastBlock;

  isSynced = () => this.btcLastBlock === this.nodeLastBlock;

  getInfo = () => ({
    height: this.btcLastBlock,
    readonly: this.readonly,
    status: this.status,
    lastError: this.lastError,
    relayContractAddress: this.relayContractAddress,
    network: process.env.NETWORK,
    btcNodeUrl: process.env.BTC_NODE_URL,
    hmyNodeUrl: process.env.HMY_NODE_URL,
  });
}
