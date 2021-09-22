const axios = require('axios');
const bitcoin = require('bitcoinjs-lib');

export const sleep = ms => new Promise(res => setTimeout(res, ms));

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
