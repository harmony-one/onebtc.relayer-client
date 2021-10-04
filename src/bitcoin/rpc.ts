import { getBech32FromHex } from './helpers';

const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');

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
