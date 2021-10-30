import EventEmitter from 'events';
import { databaseService, DBService } from './database';
import { abi as oneBtcAbi } from '../abi/OneBtc';
import { abi as relayAbi } from '../abi/Relay';
import { LogEvents, IssueService, VaultsService } from './Dashboard';
import { RelayerClient } from './Relayer';
import { VaultClient } from './VaultClient';
import { HistoryService } from './History';

export interface IServices {
  relayerClient?: RelayerClient;
  vaultClient?: VaultClient;
  database?: DBService;
  onebtcEvents?: LogEvents;
  relayEvents?: LogEvents;
  vaults?: VaultsService;
  issues?: IssueService;
  redeems?: IssueService;
  history?: HistoryService;
}

export const InitServices = async (): Promise<IServices> => {
  const eventEmitter = new EventEmitter();

  await databaseService.init();

  const services: IServices = { database: databaseService };

  services.relayerClient = new RelayerClient({
    database: databaseService,
    dbCollectionName: 'relay-headers',
    relayContractAddress: process.env.HMY_RELAY_CONTRACT,
  });

  if (process.env.HMY_RELAY_PRIVATE_KEY) {
    await services.relayerClient.start();
  }

  services.vaultClient = new VaultClient({
    database: databaseService,
    dbCollectionPrefix: 'vault-client',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter,
    services,
  });

  await services.vaultClient.start();

  services.vaults = new VaultsService({
    database: databaseService,
    dbCollectionPrefix: 'vaults',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter,
  });

  await services.vaults.start();

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

  services.relayEvents = new LogEvents({
    database: databaseService,
    dbCollectionPrefix: 'relay-events',
    contractAddress: process.env.HMY_RELAY_CONTRACT,
    contractAbi: relayAbi,
    eventEmitter,
  });

  await services.relayEvents.start();

  services.history = new HistoryService({
    database: databaseService,
    dbCollectionPrefix: 'history',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    services,
    eventEmitter,
  });

  await services.history.start();

  return services;
};
