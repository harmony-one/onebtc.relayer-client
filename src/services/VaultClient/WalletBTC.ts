import { IServices } from '../init';
const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');
const BN = require('bn.js');

import logger from '../../logger';
import { searchTxByHex } from '../../bitcoin/rpc';
import { IssueRequest } from '../common';
const log = logger.module('WalletBTC:main');

export interface IWalletBTC {
  services: IServices;
  vaultId: string;
}

export class WalletBTC {
  services: IServices;
  vaultId: string;

  constructor(params: IWalletBTC) {
    this.services = params.services;
    this.vaultId = params.vaultId;
  }

  addAndSignInputs = async (psbt, amount: string) => {
    const issues = await this.services.issues.getData({
      page: 0,
      size: 1000,
      filter: {
        vault: this.vaultId,
        status: '2',
      },
    });

    const issue: IssueRequest = issues.content[0];

    const utxo = Buffer.from(issue.btcTx.hex, 'hex');

    psbt.addInput({
      // if hash is string, txid, if hash is Buffer, is reversed compared to txid
      hash: issue.btcTx.hash,
      index: 0,
      nonWitnessUtxo: utxo,
    });

    // psbt.signInput(0, vaultEcPair2);
    psbt.validateSignaturesOfInput(0);
    psbt.finalizeAllInputs();
  };

  sendTx = async (params: { amount: string; to: string; id: string }) => {
    const psbt = new bitcoin.Psbt({
      network: bitcoin.networks.testnet,
    });

    psbt.setVersion(2); // These are defaults. This line is not needed.
    psbt.setLocktime(0); // These are defaults. This line is not needed.

    await this.addAndSignInputs(psbt, params.amount);

    const addrToBase58 = bitcoin.address.toBase58Check(Buffer.from(params.to.slice(2), 'hex'), 0);

    psbt.addOutput({
      address: addrToBase58,
      value: Number(params.amount),
    });

    const opData = new BN(params.id).toBuffer();
    const embed = bitcoin.payments.embed({ data: [opData] });
    psbt.addOutput(embed.output, 0);

    const transactionHex = psbt.extractTransaction().toHex();

    const res = await axios.post(`${process.env.BTC_NODE_URL}/broadcast`, {
      // tx: transactionHex,
      tx: '000',
    });

    if (res.data.success !== true) {
      throw new Error('Error to send broadcast');
    }

    const tx = await searchTxByHex({
      addrHex: params.to,
      txHex: transactionHex,
    });

    return {
      status: true,
      transactionHash: tx.hash,
    };
  };
}
