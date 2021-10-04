import { Action } from '../Action';
import { OPERATION_TYPE } from '../interfaces';
import { redeem } from './redeem';
import { IOperationInitParams } from '../Operation';
import { createError } from '../../../utils';
import { WalletBTC } from '../WalletBTC';

export const generateActionsPool = (
  params: IOperationInitParams,
  walletBTC: WalletBTC
): { actions: Array<Action>; rollbackActions: Array<Action> } => {
  if (params.type == OPERATION_TYPE.REDEEM) {
    return redeem(params, walletBTC);
  }

  throw createError(500, 'Operation or token type not found');
};
