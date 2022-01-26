import EventEmitter from 'events';
import { databaseService, DBService } from './database';
import { abi as oneBtcAbi } from '../abi/OneBtc';
import { LogEvents, IssueService, VaultsService } from './Dashboard';
import { RelayerClient } from './Relayer';
import { VaultClient } from './VaultClient';
import { HistoryService } from './History';
import {OracleClient} from "./OracleClient";
import {VaultSettingService} from "./VaultClient/VaultSettings/VaultSettings";

export interface IServices {
  relayerClient?: RelayerClient;
  oracleClient?: OracleClient;
  vaultClient?: VaultClient;
  database?: DBService;
  onebtcEvents?: LogEvents;
  relayEvents?: LogEvents;
  vaults?: VaultsService;
  issues?: IssueService;
  redeems?: IssueService;
  history?: HistoryService;
  vaultDbSettings?: VaultSettingService;
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
