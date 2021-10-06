const BN = require('bn.js');
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
const bitcoin = require('bitcoinjs-lib');
import { getBlockByHeight, getMerkleProof, getTransactionByHash } from '../bitcoin/rpc';

import logger from '../logger';
const log = logger.module('HmyContractManager:main');

export interface IHmyContractManager {
  hmyPrivateKey: string;
  contractAddress: string;
  contractAbi: any;
  nodeUrl: string;
}

export class HmyContractManager {
  web3: Web3;
  contract: Contract;
  masterAddress: string;

  constructor(params: IHmyContractManager) {
    const web3Hmy = new Web3(params.nodeUrl);
    this.web3 = web3Hmy;

    const ethMasterAccount = web3Hmy.eth.accounts.privateKeyToAccount(params.hmyPrivateKey);
    web3Hmy.eth.accounts.wallet.add(ethMasterAccount);
    web3Hmy.eth.defaultAccount = ethMasterAccount.address;

    this.masterAddress = ethMasterAccount.address;
    this.contract = new web3Hmy.eth.Contract(params.contractAbi, params.contractAddress);
  }

  executeRedeemHmy = async (params: {
    transactionHash: string;
    redeemId: string;
    requester: string;
    vault: string;
  }) => {
    const { height, index, hash, hex } = await getTransactionByHash(params.transactionHash);

    const block = await getBlockByHeight(height);
    const proof = await getMerkleProof(hash, height);

    const tx = bitcoin.Transaction.fromHex(hex);
    const hexForTxId = tx.__toBuffer().toString('hex');

    const res = await this.contract.methods
      .executeRedeem(
        params.requester,
        params.redeemId,
        '0x' + proof,
        '0x' + hexForTxId,
        height,
        index,
        '0x' + block.toHex()
      )
      .send({
        from: this.masterAddress,
        gas: process.env.HMY_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
      });

    return res;
  };

  getVaultInfo = async () => {
    const vault = await this.contract.methods.vaults(this.masterAddress).call();
    return vault.btcPublicKeyX === '0'
      ? null
      : {
          btcPublicKeyX: vault.btcPublicKeyX,
          btcPublicKeyY: vault.btcPublicKeyY,
          collateral: vault.collateral,
          issued: vault.issued,
          toBeIssued: vault.toBeIssued,
          toBeRedeemed: vault.toBeRedeemed,
          replaceCollateral: vault.replaceCollateral,
          toBeReplaced: vault.toBeReplaced,
        };
  };

  register = async (collateral: string, pubX, pubY) => {
    let vault = await this.getVaultInfo();

    if (!vault) {
      const value = this.web3.utils.toWei(collateral);

      await this.contract.methods.registerVault(pubX, pubY).send({
        from: this.masterAddress,
        gas: process.env.HMY_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
        value,
      });

      vault = await this.getVaultInfo();
    }

    return vault;
  };
}
