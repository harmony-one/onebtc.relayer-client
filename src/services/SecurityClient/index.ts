import { DBService } from '../database';
import { getFullBlockByHeight, getHeight } from '../../bitcoin/rpc';

import logger from '../../logger';
import { sleep } from '../../utils';
import EventEmitter = require('events');
import { VaultsBlocker } from './VaultsBlocker';
import { IssueService } from '../Dashboard/issue';
import { LogEvents } from '../Dashboard/events';
import { RelayerClient } from '../Relayer';
import { DataLayerService, IssueRequest } from '../common';
import {
  getBase58FromHex,
  getBech32FromHex,
  getBech32Unify,
} from '../../bitcoin/helpers';
import BN from 'bn.js';
const log = logger.module('relay:Service');

export interface ISecurityClient {
  database: DBService;
  eventEmitter: EventEmitter;
  dbCollectionName: string;
  issues: IssueService;
  redeems: IssueService;
  vaultsBlocker: VaultsBlocker;
  onebtcEvents: LogEvents;
  relayer: RelayerClient;
}

export enum STATUS {
  STOPPED = 'STOPPED',
  LAUNCHED = 'LAUNCHED',
  PAUSED = 'PAUSED',
}

export interface IBlockCheckInfo {
  height: number;
  totalTxsLength: number;
  bridgeTxsLength: number;
  verifiedTxs: any[];
  hasUnPermittedTxs: boolean;
}

export class SecurityClient extends DataLayerService<IBlockCheckInfo> {
  database: DBService;

  currentBtcHeight: number;
  startBtcHeight: number;
  nodeBtcHeight: number;

  issues: IssueService;
  redeems: IssueService;
  vaultsBlocker: VaultsBlocker;
  onebtcEvents: LogEvents;
  relayer: RelayerClient;

  status = STATUS.STOPPED;
  lastError = '';

  issuesData: Array<IssueRequest & { btcAddressBech32: string; btcAddressBase58: string }>;
  eventEmitter: EventEmitter;

  constructor(params: ISecurityClient) {
    super({
      database: params.database,
      dbCollectionPrefix: params.dbCollectionName,
      contractAddress: '',
      contractAbi: [],
    });

    this.database = params.database;
    this.issues = params.issues;
    this.redeems = params.redeems;
    this.vaultsBlocker = params.vaultsBlocker;
    this.onebtcEvents = params.onebtcEvents;
    this.relayer = params.relayer;

    this.eventEmitter = params.eventEmitter;
  }

  async start() {
    try {
      // if (this.vaultsBlocker.status !== STATUS.LAUNCHED) {
      //   throw new Error('vaultsBlocker not launched');
      // }

      this.issuesData = (await this.issues.loadAllData()).map(issue => ({
        ...issue,
        btcAddressBech32: getBech32FromHex(issue.btcAddress),
        btcAddressBase58: getBase58FromHex(issue.btcAddress),
      }));

      this.eventEmitter.on('ADD_IssueRequested', issue => this.issuesData.push(issue));

      // this.startBtcHeight = Number(await getHeight()) - 100;
      this.startBtcHeight = 708987;
      // this.startBtcHeight = 720035 // stuck with this

      const req = await this.getData({ size: 1, page: 0, sort: { height: -1 } });

      if (req.content.length) {
        this.startBtcHeight = req.content[0].height;
      }

      this.currentBtcHeight = this.startBtcHeight;
      this.nodeBtcHeight = await getHeight();

      log.info(`Start Security Service - ok`, {
        height: this.currentBtcHeight,
        issuesData: this.issuesData.length,
      });

      this.status = STATUS.LAUNCHED;

      setTimeout(this.checkBlock, 100);
    } catch (e) {
      log.error('Start Security Service - failed', { error: e });
      // this.lastError = e && e.message;
    }
  }

  findIssueByBtcAddress = btcAddress =>
    this.issuesData.find(issue => {
      if (!issue.btcAddress || !btcAddress) {
        return false;
      }

      if (btcAddress.startsWith(process.env.BTC_TC_PREFIX)) {
        return issue.btcAddressBech32.toLowerCase() === btcAddress.toLowerCase();
      } else {
        return issue.btcAddressBase58.toLowerCase() === btcAddress.toLowerCase();
      }
    });

  validateSingleTransaction = async (issue: IssueRequest, tx: any) => {
    const verifiedTransfer = {
      issue,
      tx,
      vault: issue.vault,
      btcAddress: issue.btcAddress,
      transactionHash: tx.hash,
      output_length_ok: true,
      output_0_ok: true,
      output_1_ok: true,
      output_2_ok: true,
      permitted: false,
      height: this.currentBtcHeight,
    };

    if (tx.outputs?.length !== 3) {
      verifiedTransfer.output_length_ok = false;
    }

    if (!tx.outputs[2].script) {
      verifiedTransfer.output_2_ok = false;
    }

    //search redeem by script
    const req = await this.redeems.getData({ filter: { script: tx.outputs[2].script } });
    const redeem = req.content[0];

    if (!redeem) {
      verifiedTransfer.output_2_ok = false;
    }

    //check other outputs
    if (getBech32Unify(tx.outputs[1].address) !== getBech32FromHex(issue.btcAddress)) {
      verifiedTransfer.output_1_ok = false;
    }

    if (getBech32Unify(tx.outputs[0].address) !== getBech32FromHex(redeem.btcAddress)) {
      verifiedTransfer.output_0_ok = false;
    }

    const isAmountEqual = new BN(tx.outputs[0].value).eq(new BN(redeem.amountBtc));

    if (!isAmountEqual) {
      verifiedTransfer.output_0_ok = false;
    }

    verifiedTransfer.permitted = verifiedTransfer.output_0_ok && 
      verifiedTransfer.output_1_ok && 
      verifiedTransfer.output_2_ok && 
      verifiedTransfer.output_length_ok;

    return verifiedTransfer;
  };

  validateTransactions = async (txs: any[]) => {
    console.log(`txs.length: ${txs.length}`);

    const bridgeTxs = [];

    txs.forEach(tx =>
      tx.inputs.forEach(input => {
        const issue = this.findIssueByBtcAddress(input.coin?.address);

        if (issue) {
          bridgeTxs.push({ tx, issue });
        }
      })
    );

    console.log('bridgeTxs: ', bridgeTxs.length);

    const verifiedTxs = [];

    for (let i = 0; i < bridgeTxs.length; i++) {
      const newVerifiedTransfer = await this.validateSingleTransaction(bridgeTxs[i].issue, bridgeTxs[i].tx);

      const verifiedTransferIdx = verifiedTxs.findIndex(
        vtx => vtx.transactionHash === newVerifiedTransfer.transactionHash
      );

      if(verifiedTransferIdx > -1) {
        const issues = [...verifiedTxs[verifiedTransferIdx].issues];
        issues.push(newVerifiedTransfer.issue.id);

        if(!!newVerifiedTransfer.permitted) {
          verifiedTxs[verifiedTransferIdx] = { ...newVerifiedTransfer, issues };
        }
        
        verifiedTxs[verifiedTransferIdx].issues = issues;
      } else {
        verifiedTxs.push({ 
          ...newVerifiedTransfer, 
          issues: [newVerifiedTransfer.issue.id] 
        });
      }
    }

    for(let i =0; i < verifiedTxs.length; i++) {
      await this.vaultsBlocker.addSecurityCheck(verifiedTxs[i]);
    }

    return verifiedTxs.map(vtx => ({ ...vtx, tx: '', issue: '' }));
  };

  checkBlock = async () => {
    try {
      while (this.onebtcEvents.getProgress() !== '1.00') {
        console.log('Audit: Wait full events sync...');
        await sleep(5000);
      }

      console.log('-------- // ---------');
      console.log('Start loading block: ', this.currentBtcHeight);

      const fullBlockInfo = await getFullBlockByHeight(this.currentBtcHeight);

      const verifiedTxs = await this.validateTransactions(fullBlockInfo.txs);

      this.nodeBtcHeight = await getHeight();

      this.updateOrCreateData({
        height: this.currentBtcHeight,
        totalTxsLength: fullBlockInfo.txs.length,
        bridgeTxsLength: verifiedTxs.length,
        verifiedTxs: verifiedTxs,
        hasUnPermittedTxs: verifiedTxs.some(tx => !tx.permitted),
        id: String(this.currentBtcHeight),
      });

      if (this.nodeBtcHeight > this.currentBtcHeight) {
        this.currentBtcHeight = this.currentBtcHeight + 1;
      } else {
        await sleep(process.env.SYNC_INTERVAL);
      }
    } catch (e) {
      log.error('Error to check Block', { error: e, currentBtcHeight: this.currentBtcHeight });
      this.lastError = e && e.message;

      await sleep(process.env.SYNC_INTERVAL);
    }

    setTimeout(this.checkBlock, 100);
  };

  getLastAuditBlock = () => this.currentBtcHeight;

  getProgress = () =>
    (
      (this.currentBtcHeight - this.startBtcHeight) /
      (this.nodeBtcHeight - this.startBtcHeight)
    ).toFixed(2);

  getServiceInfo = () => ({
    security: {
      auditProgress: this.getProgress(),
      currentBtcHeight: this.currentBtcHeight,
      startBtcHeight: this.startBtcHeight,
      nodeBtcHeight: this.nodeBtcHeight,
      status: this.status,
      lastError: this.lastError,
    },
    events: {
      eventsLoadProgress: this.onebtcEvents.getProgress(),
      contract: this.onebtcEvents.contractAddress,
    },
    relayer: {
      isRelayerSynced: this.relayer.isSynced(),
      status: String(this.relayer.status),
      currentBtcHeight: this.relayer.btcLastBlock,
      nodeBtcHeight: this.relayer.nodeLastBlock,
      contract: this.relayer.relayContractAddress,
    },
    network: process.env.NETWORK,
    btcNodeUrl: process.env.BTC_NODE_URL,
    hmyNodeUrl: process.env.HMY_NODE_URL,
  });
}
