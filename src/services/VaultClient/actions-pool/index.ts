import { Action } from '../Action';
import { OPERATION_TYPE } from '../interfaces';
import { redeem } from './redeem';
import { returnWrongPay, sendBTC } from './return-wrong-pay';
import { IOperationInitParams } from '../Operation';
import { createError } from '../../../utils';
import { WalletBTC } from '../WalletBTC';
import { HmyContractManager } from '../../../harmony/HmyContractManager';

export const generateActionsPool = (
  params: IOperationInitParams,
  walletBTC: WalletBTC,
  hmyContractManager: HmyContractManager
): { actions: Array<Action>; rollbackActions: Array<Action> } => {
  switch(params.type) {
    case OPERATION_TYPE.REDEEM:
      return redeem(params, walletBTC, hmyContractManager);

    case OPERATION_TYPE.RETURN_WRONG_PAY:
      return returnWrongPay(params, walletBTC);

    case OPERATION_TYPE.SEEND_BTC:
      return sendBTC(params, walletBTC);  
  }

  throw createError(500, 'Operation or token type not found');
};
