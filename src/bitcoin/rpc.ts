import { getBech32FromHex } from './helpers';
const axios = require('axios');
import { sleep } from '../utils';
const bitcoin = require('bitcoinjs-lib');
const { BcoinClient } = require('@summa-tx/bitcoin-spv-js-clients');

import logger from '../logger';
const log = logger.module('BTC-RPC:main');

export const getBlockByHeight = async height => {
  const response = await axios.get(`${process.env.BTC_NODE_URL}/header/${height}`);

  const block = new bitcoin.Block();

  block.version = response.data.version;
  block.timestamp = response.data.time;
  block.bits = response.data.bits;
  block.prevHash = Buffer.from(response.data.prevBlock, 'hex').reverse();
  block.merkleRoot = Buffer.from(response.data.merkleRoot, 'hex').reverse();
  block.nonce = response.data.nonce;
  block.height = response.data.height;
  block.hash = response.data.hash;
  block.chainwork = response.data.chainwork;

  return block;
};

export const getHeight = async () => {
  const response = await axios.get(`${process.env.BTC_NODE_URL}`);

  return response.data.chain.height;
};

export const getNetworkFee = async () => {
  try {
    const res = await axios.get(`${process.env.BTC_NODE_URL}/fee`);

    return Number(res.data.rate);
  } catch (e) {
    log.error('Error getNetworkFee', {
      error: e,
      url: process.env.BTC_NODE_URL,
    });
  }
};

export const getTxsByAddress = async (bech32Address: string) => {
  try {
    const response = await axios.get(`${process.env.BTC_NODE_URL}/tx/address/${bech32Address}`);

    return response.data;
  } catch (e) {
    log.error('Error getTransactionByAddress', {
      error: e,
      bech32Address,
      url: process.env.BTC_NODE_URL,
    });
  }
};

export const getTxByParams = async (params: { btcAddress: string; value: string }) => {
  try {
    const bech32Address = getBech32FromHex(params.btcAddress);

    const response = await axios.get(`${process.env.BTC_NODE_URL}/tx/address/${bech32Address}`);

    return response.data.find(
      (item: any) =>
        item.outputs &&
        item.outputs.find(out => out.address === bech32Address) &&
        !item.inputs.some(inp => inp.coin?.address === bech32Address)
    );
  } catch (e) {
    log.error('Error getTransactionByAddress', {
      error: e,
      params,
      url: process.env.BTC_NODE_URL,
    });
  }
};

const WAIT_INTERVAL = 5000;

export const waitTxForConfirmations = async (hash: string, minConfirmations: number) => {
  while (true) {
    const res = await axios.get(`${process.env.BTC_NODE_URL}/tx/${hash}`);

    if (res.data.confirmations >= minConfirmations) {
      return { status: true, transaction: res.data, transactionHash: res.data.hash };
    }

    await sleep(WAIT_INTERVAL);
  }
};

export const getTransactionByHash = async (transactionHash: string) => {
  const response = await axios.get(`${process.env.BTC_NODE_URL}/tx/${transactionHash}`);
  return response.data;
};

const options = {
  network: 'testnet',
  port: 80,
  apiKey: 'api-key',
  host: process.env.BTC_NODE_URL,
};

const client = new BcoinClient(options);

export const getMerkleProof = async (hash: string, height: number) => {
  const merkleProofRes = await client.getMerkleProof(hash, height);
  return merkleProofRes[0].map(value => Buffer.from(value, 'hex').toString('hex')).join('');
};

export const searchTxByHex = async (params: { bech32Address: string; txHex: string }) => {
  const response = await axios.get(
    `${process.env.BTC_NODE_URL}/tx/address/${params.bech32Address}`
  );

  return response.data.find(item => item.hex === params.txHex);
};
