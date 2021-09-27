import { databaseService, DBService } from './database';
import { LogEvents } from './events';
import { RelayerService } from './relayer';
import { abi as oneBtcAbi } from '../abi/OneBtc';
import { abi as relayAbi } from '../abi/Relay';

export interface IServices {
  relayer: RelayerService;
  database: DBService;
  onebtcEvents: LogEvents;
  relayEvents: LogEvents;
}

export const InitServices = async (): Promise<IServices> => {
  await databaseService.init();

  const relayer = new RelayerService({
    database: databaseService,
    dbCollectionName: 'relay-headers',
    relayContractAddress: process.env.HMY_RELAY_CONTRACT,
  });

  // await relayer.start();

  const onebtcEvents = new LogEvents({
    database: databaseService,
    dbCollectionPrefix: 'onebtc-events',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
  });

  await onebtcEvents.start();

  const relayEvents = new LogEvents({
    database: databaseService,
    dbCollectionPrefix: 'relay-events',
    contractAddress: process.env.HMY_RELAY_CONTRACT,
    contractAbi: relayAbi,
  });

  await relayEvents.start();

  return {
    relayEvents,
    onebtcEvents,
    relayer,
    database: databaseService,
  };
};
