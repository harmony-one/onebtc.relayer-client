import { getBech32FromHex } from './helpers';
const axios = require('axios');
import { sleep } from '../utils';
const bitcoin = require('bitcoinjs-lib');
const { BcoinClient } = require('@summa-tx/bitcoin-spv-js-clients');

const merkle = require('@summa-tx/bitcoin-spv-js-clients/lib/vendor/merkle');
const hash256 = require('@summa-tx/bitcoin-spv-js-clients/lib/vendor/hash256');
const assert = require('@summa-tx/bitcoin-spv-js-clients/lib/vendor/bsert');

const fetch = require('node-fetch')
const Progress = require('node-fetch-progress')

import logger from '../logger';
import { Buffer } from 'buffer';
import BN from 'bn.js';
const log = logger.module('BTC-RPC:main');

export const getBlockByHeight = async (height) => {
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

export const getFullBlockByHeight = async (height) => {
  const response = await fetch(`${process.env.BTC_NODE_URL}/block/${height}`);

  const progress = new Progress(response, { throttle: 100 });
  
  progress.on('progress', (p) => {
    // console.log(
    //   p.total,
    //   p.done,
    //   p.totalh,
    //   p.doneh,
    //   p.startedAt,
    //   p.elapsed,
    //   p.rate,
    //   p.rateh,
    //   p.estimated,
    //   p.progress,
    //   p.eta,
    //   p.etah,
    //   p.etaDate
    // )

    console.log(
      p.totalh,
      p.doneh,
      Number(p.progress * 100).toFixed(0),
    )
  });

  const data = await response.json();

  return data;
};

export const getHeight = async () => {
  const response = await axios.get(`${process.env.BTC_NODE_URL}`);

  return response.data.chain.height;
};

export const getNetworkFee = async () => {
  try {
    const res = await getTxFee();
    return Math.round(res);
    // const res = await axios.get(`${process.env.BTC_NODE_URL}/fee`);

    // return Number(res.data.rate);
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

// export const getMerkleProof = async (hash: string, height: number) => {
//   const merkleProofRes = await client.getMerkleProof(hash, height);
//   return merkleProofRes[0].map(value => Buffer.from(value, 'hex').toString('hex')).join('');
// };

export const searchTxByHex = async (params: { bech32Address: string; txHex: string }) => {
  const response = await axios.get(
    `${process.env.BTC_NODE_URL}/tx/address/${params.bech32Address}`
  );

  return response.data.find(item => item.hex === params.txHex);
};

export const getMerkleProof = async (txid, height) => {
  const response = await axios.get(`${process.env.BTC_NODE_URL}/block/${height}`);
  const block = response.data;

  let index = block.txs.findIndex(tx => tx.hash === txid);

  const txs = block.txs.map(tx => Buffer.from(tx.hash, 'hex').reverse());

  assert(index >= 0, 'Transaction not in block.');

  const [root] = merkle.createRoot(hash256, txs.slice());
  assert.bufferEqual(Buffer.from(block.merkleRoot, 'hex').reverse(), root);

  const branch = merkle.createBranch(hash256, index, txs.slice());

  const proof = [];
  for (const hash of branch) {
    proof.push(hash.toString('hex'));
  }

  // return [proof, index];

  return proof.map(value => Buffer.from(value, 'hex').toString('hex')).join('');
};

export const findTxByScript = async (params: { bech32Address: string; script: string }) => {
  const txs = await getTxsByAddress(params.bech32Address);

  return txs.find(tx => {
    return tx.outputs.some(
      out => (out.address = params.bech32Address && out.script === params.script)
    );
  });
};

export const findTxByRedeemId = async (params: { btcAddress: string; id: string }) => {
  const toBech32Address = bitcoin.address.toBech32(
    Buffer.from(params.btcAddress.slice(2), 'hex'),
    0,
    process.env.BTC_TC_PREFIX
  );

  const emb = bitcoin.payments.embed({ data: [new BN(params.id).toBuffer()] });

  return await findTxByScript({
    bech32Address: toBech32Address,
    script: emb.output.toString('hex'),
  });
};

export const getTxFee = async () => {
  const response = await axios.get('https://bitcoiner.live/api/fees/estimates/latest');
  const fee = response.data.estimates[30].total.p2pkh.satoshi;
  return Math.round(fee);
};
