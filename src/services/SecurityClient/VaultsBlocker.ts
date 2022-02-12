import Web3 from 'web3';
import { DBService } from '../database';
import { abi } from '../../abi/Relay';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getHeight } from '../../bitcoin/rpc';

import logger from '../../logger';
import { IServices } from '../init';
import EventEmitter = require('events');
import {STATUS} from "./index";
const log = logger.module('VaultsBlocker:main');

import { DataLayerService, IssueRequest } from '../common';

export interface ISecurityClient {
  dbCollectionName: string;
  contractAddress: string;
  eventEmitter: EventEmitter;
  services: IServices;
}

export interface ISecurityCheck {
  vault: string;
  height: number;
  btcAddress: string;
  transactionHash: string;
  output_length_ok: boolean;
  output_0_ok: boolean;
  output_1_ok: boolean;
  output_2_ok: boolean;
  issue: IssueRequest,
  tx: any,
  permitted: boolean;
  notDoublePayment: boolean;
  redeemScript: string;
  redeemId: string;
  issueId: string;
  doublePaymentTxHash: string;
};

export class VaultsBlocker extends DataLayerService<ISecurityCheck> {
  database: DBService;
  dbCollectionName = 'security';

  web3: Web3;
  ethMasterAccount: string;
  securityContract: Contract;
  contractAddress: string;

  lastBtcHeight: number;
  startBtcHeight: number;

  status = STATUS.STOPPED;
  lastError = '';

  constructor(params: ISecurityClient) {
    super({
      database: params.services.database,
      dbCollectionPrefix: params.dbCollectionName,
      contractAddress: params.contractAddress,
      contractAbi: abi,
    });

    this.database = params.services.database;
    this.dbCollectionName = params.dbCollectionName;

    this.web3 = new Web3(process.env.HMY_NODE_URL);

    this.contractAddress = params.contractAddress;
  }

  async start() {
    try {
      if (process.env.HMY_SECURITY_PRIVATE_KEY) {
        let ethMasterAccount = this.web3.eth.accounts.privateKeyToAccount(
          process.env.HMY_SECURITY_PRIVATE_KEY
        );

        this.web3.eth.accounts.wallet.add(ethMasterAccount);
        this.web3.eth.defaultAccount = ethMasterAccount.address;
        this.ethMasterAccount = ethMasterAccount.address;

        this.securityContract = new this.web3.eth.Contract(abi as AbiItem[], this.contractAddress);

        this.startBtcHeight = (await getHeight()) - 100;

        // const res = await this.securityContract.methods.getBestBlock().call();
        // this.btcLastBlock = Number(res.height);
      } else {
        throw new Error('HMY_SECURITY_PRIVATE_KEY not found');
      }

      log.info(`Start VaultsBlocker Service - ok`);

      this.status = STATUS.LAUNCHED;

      // setTimeout(this.checkBlock, 100);
    } catch (e) {
      log.error('Start VaultsBlocker Service - failed', { error: e });
      // this.lastError = e && e.message;
    }
  }

  addSecurityCheck = async (securityCheck: ISecurityCheck) => {
    log.info('SECURITY ALERT: ', { ...securityCheck, tx: '', issue: '' });

    await this.updateOrCreateData({ ...securityCheck, id: securityCheck.transactionHash });
  };
}
