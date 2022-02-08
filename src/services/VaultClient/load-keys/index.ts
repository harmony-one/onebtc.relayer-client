import { getSecretKeyAWS } from '../../../harmony/utils';
import logger from '../../../logger';
import { DBService } from '../../database';
import { loadFromStdIn } from './stdin-utils';
import {loadFromDatabase} from "./database";
import {IServices} from "../../init";
const log = logger.module('LoadKeys:main');

export enum WALLET_TYPE {
  ENV = 'env',
  AWS = 'aws',
  DATABASE = 'database',
  CONSOLE = 'console',
}

export const loadKey = async (params: {
  envKey;
  awsKeyFile;
  dbKey;
  name;
  services: IServices;
}): Promise<string> => {
  let secretKey;

  switch (process.env.VAULT_CLIENT_WALLET) {
    case WALLET_TYPE.ENV:
      secretKey = process.env[params.envKey];
      break;

    case WALLET_TYPE.AWS:
      secretKey = await getSecretKeyAWS(params.awsKeyFile);
      break;

    case WALLET_TYPE.CONSOLE:
      secretKey = await loadFromStdIn(`Please enter your ${params.name} private key`);
      break;

    case WALLET_TYPE.DATABASE:
      secretKey = await loadFromDatabase(params.dbKey, params.services);
      break;

    default:
      secretKey = process.env[params.envKey];
      break;
  }

  if (!secretKey) {
    throw new Error(
      `${params.name} vault key not found, used ${process.env.VAULT_CLIENT_WALLET}`
    );
  }

  console.log(
    `\n${params.name} vault key successfully loaded, used ${process.env.VAULT_CLIENT_WALLET}`
  );

  return secretKey;
};
