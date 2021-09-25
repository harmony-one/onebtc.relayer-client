import { databaseService, DBService } from './database';
import { LogEvents } from './logEvents';
import { RelayerService } from './relayer';
import { abi as oneBtcAbi } from '../abi/OneBtc';
// import { abi as relayAbi } from '../abi/Relay';

export interface IServices {
  relayer: RelayerService;
  database: DBService;
  issueLogs: LogEvents;
  // redeemLogs: LogEvents;
  // vaultLogs: LogEvents;
}

export const InitServices = async (): Promise<IServices> => {
  const relayer = new RelayerService({
    database: databaseService,
    dbCollectionName: 'relay-headers',
    relayContractAddress: process.env.HMY_RELAY_CONTRACT,
  });

  // await relayer.start();

  const issueLogs = new LogEvents({
    database: databaseService,
    dbCollectionName: 'issue-logs',
    contractAddress: process.env.HMY_ONE_BTC_CONTRACT,
    contractAbi: oneBtcAbi,
    eventName: 'IssueRequest',
  });

  await issueLogs.start();

  return {
    issueLogs,
    // redeemLogs,
    // vaultLogs,
    relayer,
    database: databaseService,
  };
};
