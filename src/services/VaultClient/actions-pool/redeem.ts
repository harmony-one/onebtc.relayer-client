import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { IOperationInitParams } from '../Operation';
import { waitTxForConfirmations } from '../../../bitcoin/rpc';
import { WalletBTC } from '../WalletBTC';
import { HmyContractManager } from '../../../harmony/HmyContractManager';

import logger from '../../../logger';
const log = logger.module('VaultClient:redeem');

export const redeem = (
  params: IOperationInitParams,
  wallet: WalletBTC,
  hmyContractManager: HmyContractManager
) => {
  const transferBTC = new Action({
    type: ACTION_TYPE.transferBTC,
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
      await wallet.waitRelayerSynchronization();

      return await waitTxForConfirmations(transferBTC.payload.transactionHash, 2);
    }
  });

  const executeRedeem = new Action({
    type: ACTION_TYPE.executeRedeem,
    // startRollbackOnFail: true,
    callFunction: () =>
      hmyContractManager.executeRedeemHmy({
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
