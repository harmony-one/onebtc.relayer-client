import { OPERATION_TYPE, STATUS } from './interfaces';
import { Action } from './Action';
import { generateActionsPool } from './actions-pool';
import { WalletBTC } from './WalletBTC';

import logger from '../../logger';
import { HmyContractManager } from '../../harmony/HmyContractManager';
const log = logger.module('VaultClient:operation');

export interface IOperationInitParams {
  id: string;
  type: OPERATION_TYPE;
  btcAddress: string;
  vault: string;
  requester: string;
  amount: string;
  status?: STATUS;
  actions?: Array<Action | any>;
  timestamp?: number;
  wasRestarted?: number;
}

export type TSyncOperationCallback = (operation: Operation) => Promise<void>;

export class Operation {
  id: string;
  type: OPERATION_TYPE;
  status: STATUS;
  amount: string;
  timestamp: number;
  actions: Action[];
  rollbackActions: Action[];
  wasRestarted = 0;
  btcAddress: string;
  vault: string;
  requester: string;

  syncOperationCallback: TSyncOperationCallback;

  asyncConstructor = async (
    params: IOperationInitParams,
    callback: TSyncOperationCallback,
    wallet: WalletBTC,
    hmyContractManager: HmyContractManager,
    validateBeforeStart: (id: string) => Promise<any>
  ) => {
    this.id = params.id;
    this.amount = params.amount;
    this.requester = params.requester;
    this.vault = params.vault;
    this.btcAddress = params.btcAddress;
    this.type = params.type;
    this.wasRestarted = params.wasRestarted;

    this.timestamp = !!params.status ? params.timestamp : Math.round(+new Date() / 1000);

    this.syncOperationCallback = callback;

    const { actions, rollbackActions } = generateActionsPool(params, wallet, hmyContractManager);

    this.actions = actions;
    this.rollbackActions = rollbackActions;

    this.status = params.status;

    if (!!this.status) {
      // init from DB
      this.actions.forEach(action => {
        const actionFromDB = params.actions.find(a => a.type === action.type);

        if (actionFromDB) {
          action.setParams(actionFromDB);
        }
      });
    } else {
      this.status = STATUS.WAITING;
    }

    try {
      if (params.type !== OPERATION_TYPE.SEEND_BTC) {
        const status = await validateBeforeStart(params.id);

        switch (status) {
          case 0:
            this.status = STATUS.ERROR;
            break;

          case 1:
            this.status = STATUS.IN_PROGRESS;
            break;

          case 2:
            this.status = STATUS.SUCCESS;
            break;

          case 3:
            this.status = STATUS.CANCELED;
            break;
        }
      } else {
        this.status = STATUS.WAITING;
      }
    } catch (e) {
      log.error('validateBeforeStart', { error: e });

      this.status = STATUS.ERROR;
    }

    if (this.status === STATUS.WAITING || this.status === STATUS.IN_PROGRESS) {
      this.startActionsPool();
    } else {
      await this.syncOperationCallback(this);
    }
  };

  startActionsPool = async () => {
    let actionIndex = 0;

    // TODO: add mode for continue operation loading from DB
    if (this.actions.some(a => a.status === STATUS.IN_PROGRESS)) {
      return;
    }

    if (![STATUS.IN_PROGRESS, STATUS.WAITING].includes(this.status)) {
      return;
    }

    this.status = STATUS.IN_PROGRESS;

    // log.info('Operation start', { type: this.type.toString(), token: this.token });

    while (this.actions[actionIndex]) {
      const action = this.actions[actionIndex];

      if (action.awaitConfirmation || action.status === STATUS.WAITING) {
        const res = await action.call();

        if (!res) {
          this.status = action.status === STATUS.CANCELED ? STATUS.CANCELED : STATUS.ERROR;
          await this.syncOperationCallback(this);

          if (action.startRollbackOnFail) {
            // this.actions = this.actions.concat(
            //   this.rollbackActions,
            //   needWithdrawOne ? generateWithdrawalAction(this) : []
            // );
          } else {
            return;
          }
        }

        await this.syncOperationCallback(this);
      }

      actionIndex++;
    }

    if (this.status === STATUS.IN_PROGRESS) {
      this.status = STATUS.SUCCESS;
      log.info('Operation success', { id: this.id, btcAddress: this.btcAddress });
    }

    // log.info('Operation success', { status: this.status, id: this.id });

    await this.syncOperationCallback(this);
  };

  toObject = (params?: { payload?: boolean }) => {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      amount: this.amount,
      btcAddress: this.btcAddress,
      vault: this.vault,
      requester: this.requester,
      wasRestarted: this.wasRestarted,
      timestamp: this.timestamp || this.actions[0].timestamp,
      actions: this.actions.map(a => a.toObject(params)),
    };
  };
}
