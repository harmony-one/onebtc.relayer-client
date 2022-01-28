import { rpcErrorMessage } from './helpers';

const BN = require('bn.js');
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
const bitcoin = require('bitcoinjs-lib');
import { getBlockByHeight, getMerkleProof, getTransactionByHash } from '../bitcoin/rpc';
import { sleep } from '../utils';

import logger from '../logger';
import { loadKey } from '../services/VaultClient/load-keys';
import { DBService } from '../services/database';
import {IServices} from "../services/init";
const log = logger.module('HmyContractManager:main');

export interface IHmyContractManager {
  contractAddress: string;
  contractAbi: any;
  nodeUrl: string;
  database: DBService;
  services: IServices;
}

export class HmyContractManager {
  web3: Web3;
  contract: Contract;
  masterAddress: string;
  contractAddress: string;
  contractAbi: any;
  database: DBService;
  services: IServices;

  constructor(params: IHmyContractManager) {
    this.web3 = new Web3(params.nodeUrl);
    this.contractAbi = params.contractAbi;
    this.contractAddress = params.contractAddress;
    this.database = params.database;
    this.services = params.services;
  }

  init = async () => {
    const hmyPrivateKey = await loadKey({
      awsKeyFile: 'hmy-secret',
      envKey: 'HMY_VAULT_PRIVATE_KEY',
      dbKey: 'hmyPrivateKey',
      name: 'Harmony',
      database: this.database,
      services: this.services,
    });

    const ethMasterAccount = this.web3.eth.accounts.privateKeyToAccount(hmyPrivateKey);
    this.web3.eth.accounts.wallet.add(ethMasterAccount);
    this.web3.eth.defaultAccount = ethMasterAccount.address;

    this.masterAddress = ethMasterAccount.address;
    this.contract = new this.web3.eth.Contract(this.contractAbi, this.contractAddress);
  };

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

    try {
      return await this.contract.methods
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
    } catch (e) {
      if (rpcErrorMessage(e)) {
        // log.error('executeRedeemHmy exception rpcErrorMessage', { params, error: e });
        log.info('executeRedeemHmy rpc error - another attempt in 10s ...');

        await sleep(10000);

        return await this.executeRedeemHmy(params);
      } else {
        throw e;
      }
    }
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

      try {
        await this.contract.methods.registerVault(pubX, pubY).send({
          from: this.masterAddress,
          gas: process.env.HMY_GAS_LIMIT,
          gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
          value,
        });
      } catch (e) {
        if (rpcErrorMessage(e)) {
          // log.error('register exception rpcErrorMessage', { collateral, pubX, pubY, error: e });
          log.info('register rpc error - another attempt in 10s ...');

          await sleep(10000);

          return await this.register(collateral, pubX, pubY);
        } else {
          throw e;
        }
      }

      vault = await this.getVaultInfo();
    }

    return vault;
  };
}
