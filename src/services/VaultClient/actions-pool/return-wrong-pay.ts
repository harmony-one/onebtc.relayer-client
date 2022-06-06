import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { IOperationInitParams } from '../Operation';
import { waitTxForConfirmations } from '../../../bitcoin/rpc';
import { WalletBTC } from '../WalletBTC';
import { HmyContractManager } from '../../../harmony/HmyContractManager';

import logger from '../../../logger';
const log = logger.module('VaultClient:redeem');

export const returnWrongPay = (
  params: IOperationInitParams,
  wallet: WalletBTC
) => {
  const validateWrongPayment = new Action({
    type: ACTION_TYPE.validateWrongPayment,
    callFunction: async () => 
      await wallet.services.wrongPayment.validateWrongPayment(params.id, params.vault)
  });

  const returnBTC = new Action({
    type: ACTION_TYPE.returnBTC,
    callFunction: () =>
      wallet.sendTxSafe({
        to: params.btcAddress,
        amount: params.amount,
        id: params.id,
      }),
  });

  const waitingConfirmations = new Action({
    type: ACTION_TYPE.waitingConfirmations,
    callFunction: async () => {
      return await waitTxForConfirmations(returnBTC.payload.transactionHash, 2);
    }
  });

  return {
    actions: [validateWrongPayment, returnBTC, waitingConfirmations],
    rollbackActions: [],
  };
};
