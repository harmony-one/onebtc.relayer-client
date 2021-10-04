import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

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

    const ethMasterAccount = web3Hmy.eth.accounts.privateKeyToAccount(params.hmyPrivateKey);
    web3Hmy.eth.accounts.wallet.add(ethMasterAccount);
    web3Hmy.eth.defaultAccount = ethMasterAccount.address;

    this.masterAddress = ethMasterAccount.address;
    this.contract = new web3Hmy.eth.Contract(params.contractAbi, params.contractAddress);
  }
}
