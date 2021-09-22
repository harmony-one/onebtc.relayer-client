import { databaseService, DBService } from './database';
import { RelayerService } from './relayer';

export interface IServices {
  relayer: RelayerService;
  database: DBService;
}

export const InitServices = async (): Promise<IServices> => {
  const relayer = new RelayerService({
    database: databaseService,
    dbCollectionName: 'relay-headers',
    relayContractAddress: process.env.HMY_RELAY_CONTRACT,
  });

  await relayer.start();

  return {
    relayer,
    database: databaseService,
  };
};
