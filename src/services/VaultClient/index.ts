import EventEmitter = require('events');
import {
  CONTRACT_EVENT,
  DataLayerService,
  ILogEventsService,
  IssueRequestEvent,
  RedeemRequest,
} from '../common';
import logger from '../../logger';
import { IServices } from '../init';
import { IOperationInitParams, Operation } from './Operation';
import { OPERATION_TYPE } from './interfaces';
// import { IssueRequestEvent } from '../common/interfaces';
const log = logger.module('VaultClient:main');

export interface IVaultClient extends ILogEventsService {
  eventEmitter: EventEmitter;
  vaultId: string;
  masterKey?: string;
  services: IServices;
}

export class VaultClient extends DataLayerService<IOperationInitParams> {
  eventEmitter: EventEmitter;
  vaultId: string;
  masterKey: string;

  services: IServices;

  operations: Operation[] = [];

  waitInterval = Number(process.env.WAIT_INTERVAL) || 1000;

  constructor(params: IVaultClient) {
    super(params);

    this.services = params.services;

    this.vaultId = params.vaultId;
    this.masterKey = params.masterKey;

    this.eventEmitter = params.eventEmitter;
    // this.eventEmitter.on(`ADD_${CONTRACT_EVENT.IssueRequest}`, this.addIssue);
    this.eventEmitter.on(`ADD_${CONTRACT_EVENT.RedeemRequest}`, this.addRedeem);
  }

  async start() {
    try {
      if (!this.masterKey || !this.vaultId) {
        // throw new Error(`Master Key not found`);
      }

      log.info(`Start Vault Client - ok`);
    } catch (e) {
      log.error(`Start Vault Client - failed`, { error: e });
      throw new Error(`Start Vault Client: ${e.message}`);
    }
  }

  isClientVault = (vaultId: string) => vaultId.toLowerCase() === this.vaultId.toLowerCase();

  onIssueRequest = async (data: IssueRequestEvent) => {
    if (this.isClientVault(data.returnValues.vaultId)) {
    }
  };

  saveOperationToDB = async (operation: Operation) => {
    return await this.updateOrCreateData(operation.toObject({ payload: true }));
  };

  validateOperationBeforeCreate = async (params: IOperationInitParams) => {
    if (this.operations.find(o => o.id === params.id)) {
      log.error('Operation already created', { params });
      throw new Error('This operation already created');
    }
  };

  createOperation = async (params: IOperationInitParams) => {
    await this.validateOperationBeforeCreate(params);

    const operation = new Operation();

    await operation.asyncConstructor(
      {
        id: params.id,
        type: params.type,
        btcAddress: params.btcAddress,
        vault: params.vault,
        requester: params.requester,
        amount: params.amount,
      },
      this.saveOperationToDB,
      this.services
    );

    await this.saveOperationToDB(operation);

    this.operations.push(operation);

    return operation.toObject();
  };

  addRedeem = async (redeem: RedeemRequest) => {
    if (redeem.vault === this.vaultId && redeem.status === '1') {
      await this.createOperation({
        id: redeem.id,
        type: OPERATION_TYPE.REDEEM,
        vault: redeem.vault,
        requester: redeem.requester,
        btcAddress: redeem.btcAddress,
        amount: redeem.amountBtc,
      });
    }
  };
}
