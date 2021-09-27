import Web3 from 'web3';
import { DBService } from '../database';
import { abi } from '../../abi/Relay';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getBlockByHeight, getHeight, sleep } from './btc-rpc';
const BN = require('bn.js');

import logger from '../../logger';
const log = logger.module('relay:Service');

export interface IRelayerService {
  database: DBService;
  dbCollectionName: string;
  relayContractAddress: string;
}

export class RelayerService {
  database: DBService;
  dbCollectionName = 'headers';

  web3: Web3;
  ethMasterAccount: string;
  relayContract: Contract;
  relayContractAddress: string;

  btcLastBlock: number;

  constructor(params: IRelayerService) {
    this.database = params.database;
    this.dbCollectionName = params.dbCollectionName;

    this.web3 = new Web3(process.env.HMY_NODE_URL);

    if(process.env.ETH_MASTER_PRIVATE_KEY) {
      let ethMasterAccount = this.web3.eth.accounts.privateKeyToAccount(
        process.env.ETH_MASTER_PRIVATE_KEY
      );

      this.web3.eth.accounts.wallet.add(ethMasterAccount);
      this.web3.eth.defaultAccount = ethMasterAccount.address;
      this.ethMasterAccount = ethMasterAccount.address;

      this.relayContractAddress = params.relayContractAddress;
      this.relayContract = new this.web3.eth.Contract(abi as AbiItem[], params.relayContractAddress);
    }
  }

  async start() {
    const res = await this.relayContract.methods.getBestBlock().call();
    this.btcLastBlock = Number(res.height);

    log.info('Started', { height: this.btcLastBlock });

    setTimeout(this.syncBlockHeader, 100);
  }

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

      await sleep(process.env.SYNC_INTERVAL);
    }

    setTimeout(this.syncBlockHeader, 100);
  };

  getLastRelayBlock = () => this.btcLastBlock;

  getInfo = () => ({
    height: this.btcLastBlock,
    relayContractAddress: this.relayContractAddress,
    network: process.env.NETWORK,
    btcNodeUrl: process.env.BTC_NODE_URL,
    hmyNodeUrl: process.env.HMY_NODE_URL,
  });
}
