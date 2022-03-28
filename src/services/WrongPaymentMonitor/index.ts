import { DBService } from '../database';
import { getTxsByAddress } from '../../bitcoin/rpc';

import logger from '../../logger';
import { sleep } from '../../utils';
import EventEmitter = require('events');
import { IssueService } from '../Dashboard/issue';
import { LogEvents } from '../Dashboard/events';
import { DataLayerService, IssueRequest } from '../common';
import { getBase58FromHex,  getBech32FromHex, getBech32Unify } from '../../bitcoin/helpers';
import { isAmountEqual } from './helpers';
import { IServices } from "../init_vault";
const bitcoin = require('bitcoinjs-lib');
const log = logger.module('wrongPaymant:index');

import BN from 'bn.js';

export interface ISecurityClient {
  database: DBService;
  eventEmitter: EventEmitter;
  dbCollectionName: string;
  services: IServices;
}

export enum STATUS {
  STOPPED = 'STOPPED',
  LAUNCHED = 'LAUNCHED',
  PAUSED = 'PAUSED',
}

export interface IWrongPayment {
  id: string;
  transactionHash: string;
  issue: string;
  vault: string;
  issueData?: any;
  transactionData?: any;
  alreadyReturned: boolean;
  operationId: string;
  type: TX_TYPE;
  amount: string;
  btcAddress: string;
  timestamp: string;
  error: string;
}

enum TX_TYPE {
  // correct
  ISSUE = 'ISSUE',
  REDEEM = 'REDEEM',
  WRONG_PAYMENT_RETURN = 'WRONG_PAYMENT_RETURN',

  // can be returned
  ISSUE_DUPLICATE = 'ISSUE_DUPLICATE',
  WRONG_PAYMENT = 'WRONG_PAYMENT',

  // alarm
  REDEEM_DUPLICATE = 'REDEEM_DUPLICATE',
  THEFT_OF_FUNDS = 'THEFT_OF_FUNDS',
}

export class WrongPaymentMonitor extends DataLayerService<IWrongPayment> {
  database: DBService;

  services: IServices;
  onebtcEvents: LogEvents;

  status = STATUS.STOPPED;
  lastError = '';

  issuesData: Array<IssueRequest & { btcAddressBech32: string; btcAddressBase58: string }>;
  eventEmitter: EventEmitter;

  isLoading = false;
  vault: string;

  constructor(params: ISecurityClient) {
    super({
      database: params.database,
      dbCollectionPrefix: params.dbCollectionName,
      contractAddress: '',
      contractAbi: [],
    });

    this.database = params.database;
    this.services = params.services;

    this.eventEmitter = params.eventEmitter;
  }

  async start() {
    try {
      log.info(`Start Overpay Monitoring Service - ok`);

      this.status = STATUS.LAUNCHED;
    } catch (e) {
      log.error('Start Overpay Monitoring Service - failed', { error: e });
      this.lastError = e && e.message;
    }
  }

  isIssueAddress = (issue, btcAddress) => {
    if (btcAddress.startsWith(process.env.BTC_TC_PREFIX)) {
      return issue.btcAddressBech32.toLowerCase() === btcAddress.toLowerCase();
    } else {
      return issue.btcAddressBase58.toLowerCase() === btcAddress.toLowerCase();
    }
  }

  getLastCheck = async (vault: string) => {
    const data = await this.getData({ filter: { vault } });

    if (!data.content[0]) {
      return await this.checkIssuesToWrongPayment(vault);
    } else if (Date.now() - data.content[0].lastUpdate > 300 * 1000) {
      this.checkIssuesToWrongPayment(vault);
    } else if (!!this.lastError) {
      this.checkIssuesToWrongPayment(vault);
    }

    return data;
  }

  validateSingleTransaction = async (issue: IssueRequest & { btcAddressBech32: string }, tx: any) => {
    const verifiedTransfer = {
      issueId: issue.id,
      // tx,
      vault: issue.vault,
      btcAddress: issue.btcAddress,
      transactionHash: tx.hash,
      output_length_ok: true,
      output_0_ok: true,
      output_1_ok: true,
      output_2_ok: true,
      permitted: false,
      height: tx.height,
      notDoublePayment: true,
      redeemScript: '',
      redeemId: '',
      doublePaymentTxHash: '',
    };

    if (tx.outputs?.length !== 3) {
      verifiedTransfer.output_length_ok = false;
    }

    let redeem;

    if(tx.outputs[2]) {
      if (!tx.outputs[2].script) {
        verifiedTransfer.output_2_ok = false;
      }

      //search redeem by script
      let req = await this.services.redeems.getData({ filter: { script: tx.outputs[2].script } });
      redeem = req.content[0];

      // if(!redeem) {
      //   redeem = await this.getRedeemByScript(tx.outputs[2].script);
      // }

      if (!redeem) {
        verifiedTransfer.output_2_ok = false;
      } else {
        verifiedTransfer.redeemId = redeem.id;
      }

      if(tx.outputs[2].script) {
        verifiedTransfer.redeemScript = tx.outputs[2].script;

        // req = await this.vaultsBlocker.getData({ filter: { redeemScript: tx.outputs[2].script } });
        
        // for (let i=0; i < req.content.length; i++) {
        //   const doublePaymentTx = req.content[i];

        //   if(doublePaymentTx && doublePaymentTx.transactionHash !== tx.hash) {
        //     verifiedTransfer.doublePaymentTxHash = doublePaymentTx.transactionHash;
        //     verifiedTransfer.notDoublePayment = false;
        //   }
        // }
      }
    } else {
      verifiedTransfer.output_2_ok = false;
    }

    //check other outputs
    const outpuIssue = issue; // this.findIssueByBtcAddress());

    if (issue.btcAddressBech32 !== getBech32Unify(tx.outputs[1]?.address)) {
      verifiedTransfer.output_1_ok = false;
    }

    if(redeem) {
      if (getBech32Unify(tx.outputs[0]?.address) !== getBech32FromHex(redeem.btcAddress)) {
        verifiedTransfer.output_0_ok = false;
      }

      const isAmountEqual = new BN(tx.outputs[0].value).eq(new BN(redeem.amountBtc));

      if (!isAmountEqual) {
        verifiedTransfer.output_0_ok = false;
      }
    } else {
      verifiedTransfer.output_0_ok = false;
    }

    verifiedTransfer.permitted = verifiedTransfer.output_0_ok && 
      verifiedTransfer.output_1_ok && 
      verifiedTransfer.output_2_ok && 
      verifiedTransfer.notDoublePayment && 
      verifiedTransfer.output_length_ok;

    return verifiedTransfer;
  };

  checkIssuesToWrongPayment = async (vault: string) => {
    try {
      if(this.isLoading) {
        return this.getCheckStatus();
      }

      this.vault = vault;
      this.isLoading = true;
      this.lastError = '';

      const issuesDataRes = await this.services.issues.getData({ size: 10000, filter: { vault } });
      const issuesData = issuesDataRes.content.map(issue => ({
        ...issue,
        btcAddressBech32: getBech32FromHex(issue.btcAddress),
        btcAddressBase58: getBase58FromHex(issue.btcAddress),
      }));

      log.info('Total issues: ', issuesData.length);

      for(let i=0; i < issuesData.length; i++){
        const issue = issuesData[i];

        // log.info('getTxsByAddress: ', issue.btcAddressBech32);
        let txs = await getTxsByAddress(issue.btcAddressBech32);

        // only incoming txs
        txs = txs.filter(
          tx => tx.outputs?.some(out => this.isIssueAddress(issue,  out.address  ||  ''))
        );

        for(let j=0; j < txs.length;  j++) {
          const tx = txs[j];
          
          let type = TX_TYPE.WRONG_PAYMENT;

          let error;
          let issueOutput;

          try {
            issueOutput = tx.outputs.find(
              out => {
                // console.log(111, out.value, issue.amount, isAmountEqual(out.value, issue.amount));

                return isAmountEqual(out.value, issue.amount, issue.fee || 0) &&
                this.isIssueAddress(issue,  out.address) 
              }
            );
          } catch(e) {
            log.error('Search issue error', { error: e });
          }

          if(!!issueOutput) {
            const txsByVault = await this.getData({ filter: { vault } });

            const hasDuplicate = txsByVault.content.find(
              t => t.status === TX_TYPE.ISSUE && t.id !== tx.hash
            );

            if(hasDuplicate) {
              type = TX_TYPE.ISSUE_DUPLICATE
            } else {
              type = TX_TYPE.ISSUE
            }
          } else {
            const validate = await this.validateSingleTransaction(issue, tx);

            const isRedeem = validate.output_length_ok && validate.output_1_ok;

            if(isRedeem) {
              type = TX_TYPE.REDEEM;
            } else {
              // console.log(1111, validate);
            }
          }

          let amount;
          
          if(issueOutput) {
            amount = issueOutput.value; 
          } else {
            error = 'Incorrect amount';

            const output = tx.outputs.find(
              out => this.isIssueAddress(issue,  out.address)
            );

            amount = output.value;
          }

          let alreadyReturned = false;

          if(type === TX_TYPE.WRONG_PAYMENT) {
            const operation = await this.services.vaultClient.find(tx.hash);
            if(operation && operation.amount === amount){
              // type = TX_TYPE.WRONG_PAYMENT_RETURN;
              alreadyReturned = true;
            }
          }

          this.updateOrCreateData({ 
            id: tx.hash,
            type,
            transactionHash: tx.hash,
            transactionData: {},
            issueData: {},
            issue: issue.id,
            vault: vault,
            operationId: null,  
            alreadyReturned,
            amount,
            btcAddress: issue.btcAddressBech32, 
            timestamp: tx.time,
            error
          });
        }
      }

      this.isLoading = false;

      return await this.getData({ filter: { vault } });
    } catch(e) {
      this.isLoading = false;
      this.lastError = e && e.message;
      
      throw new Error(e);
    }
  }

  validateWrongPayment = async (id, vault) => {
    const checkedPayment = await this.find(id);

    if (!checkedPayment) {
      throw new Error('Payment not found');
    }

    if(checkedPayment.type !== TX_TYPE.WRONG_PAYMENT) {
      throw new Error(`Payment type ${checkedPayment.type} icorrect for refund`);      
    }

    if(checkedPayment.vault !== vault) {
      throw new Error(`Inctorrect vault`);
    }

    const issuesDataRes = await this.services.issues.getData({ size: 10000, filter: { vault } });
    const issuesData = issuesDataRes.content.map(issue => ({
      ...issue,
      btcAddressBech32: getBech32FromHex(issue.btcAddress),
      btcAddressBase58: getBase58FromHex(issue.btcAddress),
    }));

    let txNotFound = true;

    const embed = bitcoin.payments.embed({ data: [new BN(id).toBuffer()] });
    const scriptById = embed.output;

    for(let i=0; i < issuesData.length; i++){
      const issue = issuesData[i];

      // log.info('getTxsByAddress: ', issue.btcAddressBech32);
      let txs = await getTxsByAddress(issue.btcAddressBech32);

      for(let j=0; j < txs.length;  j++) {
        const tx = txs[j];

        if(tx.hash === id) {
          txNotFound = false;
        }

        if (tx.outputs?.length === 3 && tx.outputs[2].script === scriptById) {
          throw new Error(`Payment already refunded`);
        }
      }
    }

    if(txNotFound) {
      throw new Error(`Transaction not found in Vault`);
    }

    return { status: true };
  }

  getCheckStatus = () => ({
    vault: this.vault,
    loading: this.isLoading,
    error: this.lastError,
    content: [],
  });

  getServiceInfo = () => ({
    status: this.status,
    lastError: this.lastError,
    network: process.env.NETWORK,
    btcNodeUrl: process.env.BTC_NODE_URL,
    hmyNodeUrl: process.env.HMY_NODE_URL,
  });
}
