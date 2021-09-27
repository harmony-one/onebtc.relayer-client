import EventEmitter from 'events';
import { databaseService, DBService } from './database';
import { LogEvents } from './events';
import { VaultsService } from './vaults';
import { RelayerService } from './relayer';
import { abi as oneBtcAbi } from '../abi/OneBtc';
import { abi as relayAbi } from '../abi/Relay';

export interface IServices {
  relayer: RelayerService;
  database: DBService;
  onebtcEvents: LogEvents;
  relayEvents: LogEvents;
  vaults: VaultsService;
}

export const InitServices = async (): Promise<IServices> => {
  const eventEmitter = new EventEmitter();

  await databaseService.init();

  const relayer = new RelayerService({
    database: databaseService,
    dbCollectionName: 'relay-headers',
    relayContractAddress: process.env.HMY_RELAY_CONTRACT,
  });

  // await relayer.start();

  const vaults = new VaultsService({
    database: databaseService,
    dbCollectionPrefix: 'vaults',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter,
  });

  await vaults.start();

  const onebtcEvents = new LogEvents({
    database: databaseService,
    dbCollectionPrefix: 'onebtc-events',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventEmitter
  });

  await onebtcEvents.start();

  const relayEvents = new LogEvents({
    database: databaseService,
    dbCollectionPrefix: 'relay-events',
    contractAddress: process.env.HMY_RELAY_CONTRACT,
    contractAbi: relayAbi,
    eventEmitter
  });

  await relayEvents.start();

  return {
    vaults,
    relayEvents,
    onebtcEvents,
    relayer,
    database: databaseService,
  };
};
