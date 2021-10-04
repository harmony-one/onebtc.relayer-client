import Web3 from 'web3';
const BN = require('bn.js');
import { Contract } from 'web3-eth-contract';
import { getBlockByHeight, getMerkleProof, getTransactionByHash } from './rpc';
import { abi as oneBtcAbi } from '../abi/OneBtc';

import logger from '../logger';
const log = logger.module('HmyContract:executeRedeem');

const web3Hmy = new Web3(process.env.HMY_NODE_URL);
let contract: Contract;
let hmyMasterAddress: string = '';

if (process.env.HMY_MASTER_PRIVATE_KEY) {
  let ethMasterAccount = web3Hmy.eth.accounts.privateKeyToAccount(
    process.env.HMY_MASTER_PRIVATE_KEY
  );
  web3Hmy.eth.accounts.wallet.add(ethMasterAccount);
  web3Hmy.eth.defaultAccount = ethMasterAccount.address;
  hmyMasterAddress = ethMasterAccount.address;

  contract = new web3Hmy.eth.Contract(oneBtcAbi as any, process.env.HMY_ONE_BTC_CONTRACT);
} else {
  log.error('HMY_MASTER_PRIVATE_KEY not found', {});
}

export const executeRedeemHmy = async (params: {
  transactionHash: string;
  redeemId: string;
  requester: string;
  vault: string;
}) => {
  if (params.vault.toLowerCase() !== hmyMasterAddress.toLowerCase()) {
    throw new Error('Wrong ETH_MASTER_PRIVATE_KEY to execute redeem');
  }

  const { height, index, hash, hex } = await getTransactionByHash(params.transactionHash);
  const block = await getBlockByHeight(height);
  const proof = await getMerkleProof(hash, height);

  const res = await contract.methods
    .executeIssue(
      params.requester,
      params.redeemId,
      '0x' + proof,
      '0x' + hex,
      height,
      index,
      '0x' + block.toHex()
    )
    .send({
      from: hmyMasterAddress,
      gas: process.env.ETH_GAS_LIMIT,
      gasPrice: new BN(await web3Hmy.eth.getGasPrice()).mul(new BN(1)),
    });

  return res;
};
