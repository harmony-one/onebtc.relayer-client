import { IServices } from '../../init';
const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const BN = require('bn.js');

import logger from '../../../logger';
import {
  findTxByScript,
  getNetworkFee,
  getTxsByAddress,
  searchTxByHex,
} from '../../../bitcoin/rpc';
import { IssueRequest } from '../../common';
import { Buffer } from 'buffer';
import { derivate } from './derivate';
import { convertBtcKeyToHex, getActualOutputs } from './helpers';
import { sleep } from '../../../utils';
import { ActionsQueue } from './ActionsQueue';
const log = logger.module('WalletBTC:main');

export interface IWalletBTC {
  services: IServices;
  vaultId: string;
}

interface IFreeOutput {
  id: any; // secretKey
  value: Number;
  hex: string;
  hash: string;
  index: number;
  bech32Address: string;
}

export class WalletBTC {
  services: IServices;
  vaultId: string;
  queue: ActionsQueue;
  btcPrivateKey: string;

  constructor(params: IWalletBTC) {
    this.services = params.services;
    this.vaultId = params.vaultId;
    this.queue = new ActionsQueue();
  }

  init = async (btcPrivateKey: string) => {
    this.btcPrivateKey = convertBtcKeyToHex(btcPrivateKey);
  };

  waitRelayerSynchronization = async () => {
    while (!this.services.relayerClient.isSynced()) {
      await sleep(2000);
    }
  };

  getAmountFromTx = (txObj: any, address: string) => {
    const output = txObj.outputs.find(out => out.address === address);
    return output ? output.value : 0;
  };

  getBalances = async (vaultId: string) => {
    const balances = {};

    const outs = await this.getFreeOutputs(0, true, vaultId);
    outs.forEach(o => (balances[o.bech32Address] = (balances[o.bech32Address] || 0) + o.value));

    return balances;
  };

  getTotalBalance = async (vaultId: string) => {
    const balances = {};

    let totalAmount = 0;

    const outs = await this.getFreeOutputs(0, true, vaultId);
    outs.forEach(o => {
      balances[o.bech32Address] = (balances[o.bech32Address] || 0) + o.value;
      totalAmount += Number(o.value);
    });

    return totalAmount;
  };

  ignoreIssuesList = [
    '403457160729548939033534475047079399793301172341154297055586226316249410827',
    '93300159680157977562922029065933448796220752306205143836524272577377336881',
  ];

  getOutputsByAmount = async (amount: number, vaultId: string) => {
    const outs = await this.getFreeOutputs(amount, false, vaultId);

    return outs;
  };

  getFreeOutputs = async (
    amount: number,
    getMax = false,
    vaultId = this.vaultId
  ): Promise<IFreeOutput[]> => {
    const issues = await this.services.issues.getData({
      page: 0,
      size: 100000,
      filter: {
        vault: vaultId,
        // status: '2',
      },
    });

    const freeOutputs: IFreeOutput[] = [];
    let totalAmount = 0;
    let i = 0;

    while ((getMax || totalAmount < amount) && i < issues.content.length) {
      const issue: IssueRequest = issues.content[i];

      if (this.ignoreIssuesList.includes(issue.id)) {
        i++;
        continue;
      }

      const bech32Address = bitcoin.address.toBech32(
        Buffer.from(issue.btcAddress.slice(2), 'hex'),
        0,
        process.env.BTC_TC_PREFIX
      );
      let txs = await getTxsByAddress(bech32Address);

      txs = txs.filter(tx => tx.confirmations > 0 && tx.height > -1);

      let outputs = getActualOutputs(txs, bech32Address);

      outputs.forEach(out => {
        if (getMax || totalAmount < amount) {
          console.log(out.value);

          totalAmount += Number(out.value);
          freeOutputs.push({ ...out, id: issue.id, bech32Address });
        }
      });

      // console.log(
      //   `Loaded: ${i} / ${issues.content.length}`,
      //   (totalAmount / 1e8).toFixed(2),
      //   Number(amount / 1e8).toFixed(2)
      // );

      i++;
    }

    if (totalAmount < amount) {
      throw new Error('Vault BTC Balance is too low');
    }

    return freeOutputs;
  };

  sendTxSafe = (params: { amount: string; to: string; id: string }) =>
    new Promise<{ status: boolean; transactionHash: string }>((resolve, reject) =>
      this.queue.addAction({
        func: async () => await this.sendTx(params),
        resolve,
        reject,
      })
    );

  sendTx = async (params: { amount: string; to: string; id: string }) => {
    let toBech32Address;

    if (params.to.startsWith(process.env.BTC_TC_PREFIX)) {
      toBech32Address = params.to;
    } else {
      toBech32Address = bitcoin.address.toBech32(
        Buffer.from(params.to.slice(2), 'hex'),
        0,
        process.env.BTC_TC_PREFIX
      );
    }

    const emb = bitcoin.payments.embed({ data: [new BN(params.id).toBuffer()] });

    // search the same tx
    const createdTx = await findTxByScript({
      bech32Address: toBech32Address,
      script: emb.output.toString('hex'),
    });

    if (createdTx && createdTx.height > -1) {
      log.info('Transaction already created - skip send BTC', {
        id: params.id,
        tx: createdTx.hash,
        toBech32Address,
      });

      return {
        status: true,
        transactionHash: createdTx.hash,
        tx: createdTx,
      };
    }
    // search the same tx -- end

    const psbt = new bitcoin.Psbt({
      network:
        process.env.HMY_NETWORK === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin,
    });

    psbt.setVersion(2); // These are defaults. This line is not needed.
    psbt.setLocktime(0); // These are defaults. This line is not needed.

    const networkFee = await getNetworkFee();
    const fee = Math.max(networkFee, Number(process.env.BTC_MIN_RATE));

    const freeOutputs = await this.getFreeOutputs(Number(params.amount) + fee);

    freeOutputs.forEach(output => {
      const utxo = Buffer.from(output.hex, 'hex');

      psbt.addInput({
        hash: output.hash,
        index: output.index,
        nonWitnessUtxo: utxo,
      });
    });

    psbt.addOutput({
      address: toBech32Address,
      value: Number(params.amount),
    });

    const leftAmount =
      freeOutputs.reduce((acc, out) => acc + Number(out.value), 0) - Number(params.amount);

    if(leftAmount !== 160087897) {
      throw new Error(`Wrong leftAmount ${freeOutputs.length}`);
    } 

    psbt.addOutput({
      address: freeOutputs[0].bech32Address,
      value: leftAmount - fee,
    });

    const embed = bitcoin.payments.embed({ data: [new BN(params.id).toBuffer()] });
    psbt.addOutput({
      script: embed.output,
      value: 0,
    });

    let idx = 0;

    try {
      for (idx = 0; idx < freeOutputs.length; idx++) {
        const output = freeOutputs[idx];

        const vaultEcPair = derivate(this.btcPrivateKey, output.id);

        psbt.signInput(idx, vaultEcPair);
        psbt.validateSignaturesOfInput(idx);
      }

      psbt.finalizeAllInputs();
    } catch (e) {
      log.error('Error sign input', {
        error: e,
        idx,
        freeOutput: freeOutputs[idx],
        freeOutputs,
      });

      throw new Error(`Can not sign for this input with the key, ${freeOutputs[idx]?.id}`);
    }

    log.info('Tx before send', {
      tx: {
        txOutputs: psbt.txOutputs,
        txInputs: psbt.txInputs,
        fee,
        leftAmount,
        amount: params.amount,
      },
    });

    const transactionHex = psbt.extractTransaction().toHex();

    const res = await axios.post(`${process.env.BTC_NODE_URL}/broadcast`, {
      tx: transactionHex,
    });

    if (res.data.success !== true) {
      throw new Error('Error to send broadcast');
    }

    await sleep(2000);

    const tx = await searchTxByHex({
      bech32Address: freeOutputs[0].bech32Address,
      txHex: transactionHex,
    });

    if (!tx) {
      return {
        status: false,
        transactionHash: '',
      };
    }

    log.info('Transaction succefully created', {
      id: params.id,
      tx: tx.hash,
      toBech32Address,
    });

    return {
      status: true,
      transactionHash: tx.hash,
      tx,
    };
  };
}
