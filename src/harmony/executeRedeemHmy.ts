import { HmyContractManager } from './HmyContractManager';
const BN = require('bn.js');
import { getBlockByHeight, getMerkleProof, getTransactionByHash } from '../bitcoin/rpc';

import logger from '../logger';
const log = logger.module('HmyContract:executeRedeem');

export const executeRedeemHmy = async (
  params: {
    transactionHash: string;
    redeemId: string;
    requester: string;
    vault: string;
  },
  hmyContractManager: HmyContractManager
) => {
  const { height, index, hash, hex } = await getTransactionByHash(params.transactionHash);
  const block = await getBlockByHeight(height);
  const proof = await getMerkleProof(hash, height);

  const res = await hmyContractManager.contract.methods
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
      from: hmyContractManager.masterAddress,
      gas: process.env.ETH_GAS_LIMIT,
      gasPrice: new BN(await hmyContractManager.web3.eth.getGasPrice()).mul(new BN(1)),
    });

  return res;
};
