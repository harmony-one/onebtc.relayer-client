import { DBService } from '../database';
import { getFullBlockByHeight, getHeight } from '../../bitcoin/rpc';

import logger from '../../logger';
import { sleep } from '../../utils';
import EventEmitter = require('events');
import { VaultsBlocker } from './VaultsBlocker';
import { IssueService } from '../Dashboard/issue';
import { LogEvents } from '../Dashboard/events';
import { RelayerClient } from '../Relayer';
import { IssueRequest } from '../common';
const log = logger.module('relay:Service');

export interface ISecurityClient {
  database: DBService;
  eventEmitter: EventEmitter;
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

export class SecurityClient {
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

  issuesData: IssueRequest[];
  eventEmitter: EventEmitter;

  constructor(params: ISecurityClient) {
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

      this.issuesData = await this.issues.loadAllData();
      this.eventEmitter.on('ADD_IssueRequested', issue => this.issuesData.push(issue));

      // this.startBtcHeight = Number(await getHeight()) - 100;
      this.startBtcHeight = 714382;
      // this.startBtcHeight = 720035 // stuck with this

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

  // TODO convert address to common format !!!
  findIssueByBtcAddress = btcAddress =>
    this.issuesData.find(issue => !!issue.btcAddress && issue.btcAddress === btcAddress);

  validateSingleTransaction = async (issue: IssueRequest, tx: any) => {
    if (tx.outputs?.length !== 3 || !tx.outputs[2].script) {
      this.vaultsBlocker.freezeVault(issue.vault, tx);
    }

    //search redeem by script
    const req = await this.redeems.getData({ filter: { script: tx.outputs[2].script } });
    const redeem = req.content[0];

    if (!redeem) {
      this.vaultsBlocker.freezeVault(issue.vault, tx);
    }

    //check other outputs
    if(tx.outputs[1].address !== issue.btcAddress) {
      this.vaultsBlocker.freezeVault(issue.vault, tx);
    }

    if(tx.outputs[0].address !== redeem.btcAddress) {
      this.vaultsBlocker.freezeVault(issue.vault, tx);
    }

    if(tx.outputs[0].value !== redeem.amount) {
      this.vaultsBlocker.freezeVault(issue.vault, tx);
    }
  };

  validateTransactions = async (txs: any[]) => {
    console.log('txs.length: ', txs.length);

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

    for (let i = 0; i < bridgeTxs.length; i++) {
      await this.validateSingleTransaction(bridgeTxs[i].issue, bridgeTxs[i].tx);
    }
  };

  checkBlock = async () => {
    try {
      while (this.onebtcEvents.getProgress() !== '1.00') {
        console.log('Audit: Wait full events sync...');
        await sleep(5000);
      }

      const fullBlockInfo = await getFullBlockByHeight(this.currentBtcHeight);

      await this.validateTransactions(fullBlockInfo.txs);

      this.nodeBtcHeight = await getHeight();

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

  getInfo = () => ({
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
