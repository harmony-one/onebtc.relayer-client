import EventEmitter from 'events';
import { databaseService, DBService } from './database';
import { abi as oneBtcAbi } from '../abi/OneBtc';
import { LogEvents, IssueService } from './Dashboard';
import { VaultClient } from './VaultClient';
import { RelayerClient } from './Relayer';
import {VaultSettingService} from "./VaultClient/VaultSettings/VaultSettings";

export interface IServices {
  database?: DBService;
  onebtcEvents?: LogEvents;
  issues?: IssueService;
  redeems?: IssueService;
  vaultDbSettings?: VaultSettingService;
  vaultClient?: VaultClient;
  relayerClient?: RelayerClient;
}

export const InitVault = async (): Promise<IServices> => {
  const eventEmitter = new EventEmitter();

  await databaseService.init();

  const services: IServices = { database: databaseService };

  services.vaultDbSettings = new VaultSettingService({
    database: databaseService,
    dbCollectionPrefix: 'vaultSettings',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
  });

  await services.vaultDbSettings.start();

  services.relayerClient = new RelayerClient({
    database: databaseService,
    dbCollectionName: 'relay-headers',
    relayContractAddress: process.env.HMY_RELAY_CONTRACT,
    readonly: true,
  });

  await services.relayerClient.start();

  services.vaultClient = new VaultClient({
    database: databaseService,
    dbCollectionPrefix: 'vault-client',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter,
    services,
  });

  await services.vaultClient.start();

  services.issues = new IssueService({
    database: databaseService,
    dbCollectionPrefix: 'issues',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter,
    eventName: 'IssueRequested',
    methodName: 'issueRequests',
    idEventKey: 'issueId',
    listenTxs: true,
  });

  await services.issues.start();

  services.redeems = new IssueService({
    database: databaseService,
    dbCollectionPrefix: 'redeems',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter,
    eventName: 'RedeemRequested',
    methodName: 'redeemRequests',
    idEventKey: 'redeemId',
    listenTxs: true,
  });

  await services.redeems.start();

  services.onebtcEvents = new LogEvents({
    database: databaseService,
    dbCollectionPrefix: 'onebtc-events',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter,
  });

  await services.onebtcEvents.start();

  return services;
};
