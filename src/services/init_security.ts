import EventEmitter from 'events';
import { databaseService, DBService } from './database';
import { abi as oneBtcAbi } from '../abi/OneBtc';
import { LogEvents, IssueService } from './Dashboard';
import { SecurityClient } from './SecurityClient';
import { RelayerClient } from './Relayer';
import { VaultsBlocker } from './SecurityClient/VaultsBlocker';

export interface IServices {
  database?: DBService;
  onebtcEvents?: LogEvents;
  issues?: IssueService;
  redeems?: IssueService;
  securityClient?: SecurityClient;
  relayer?: RelayerClient;
  vaultsBlocker?: VaultsBlocker;
}

export const InitSecurity = async (): Promise<IServices> => {
  const eventEmitter = new EventEmitter();

  await databaseService.init();

  const services: IServices = { database: databaseService };

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

  services.relayer = new RelayerClient({
    database: databaseService,
    dbCollectionName: 'relay-headers',
    relayContractAddress: process.env.HMY_RELAY_CONTRACT,
    readonly: true,
  });

  await services.relayer.start();

  services.vaultsBlocker = new VaultsBlocker({
    dbCollectionName: 'security-txs-2',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    eventEmitter,
    services,
  });

  await services.vaultsBlocker.start();

  services.securityClient = new SecurityClient({
    dbCollectionName: 'security-blocks-2',
    eventEmitter,
    database: services.database,
    onebtcEvents: services.onebtcEvents,
    issues: services.issues,
    redeems: services.redeems,
    relayer: services.relayer,
    vaultsBlocker: services.vaultsBlocker,
  });

  await services.securityClient.start();

  return services;
};
