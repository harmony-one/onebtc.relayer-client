import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { IOperationInitParams } from '../Operation';
import { waitTxForConfirmations } from '../../../bitcoin/rpc';
import { executeRedeemHmy } from '../../../bitcoin/executeRedeemHmy';
import { IServices } from '../../init';

import logger from '../../../logger';
const log = logger.module('VaultClient:redeem');

export const redeem = (params: IOperationInitParams, services: IServices) => {
  const transferBTC = new Action({
    type: ACTION_TYPE.transferBTC,
    callFunction: async () => {
      return {
        status: true,
        transactionHash: '75143a0ae3511938897a3a5e4985c7955362674fae51a1bc8c21814a850bde2e',
      };
    },
  });

  const waitingConfirmations = new Action({
    type: ACTION_TYPE.waitingConfirmations,
    callFunction: () => waitTxForConfirmations(transferBTC.payload.transactionHash, 2),
  });

  const executeRedeem = new Action({
    type: ACTION_TYPE.executeRedeem,
    // startRollbackOnFail: true,
    callFunction: () =>
      executeRedeemHmy({
        transactionHash: transferBTC.payload.transactionHash,
        redeemId: params.id,
        vault: params.vault,
        requester: params.requester,
      }),
  });

  return {
    actions: [transferBTC, waitingConfirmations, executeRedeem],
    rollbackActions: [],
  };
};
