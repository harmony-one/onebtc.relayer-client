import { KMS } from 'aws-sdk';
import { readFileSync } from 'fs';

import logger from '../logger';
const log = logger.module('AWSConfig:main');

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

const getAwsConfig = () => {
  // [known issue] nodejs sdk won't read the region from the credentials, hence hard coding
  return new KMS();
};

export const awsKMS = getAwsConfig();

const encryptedDir = './keys';
type TSecretFileName = 'hmy-secret' | 'btc-secret';

export const getSecretKeyAWS = (secretFileName: TSecretFileName) => {
  return new Promise<string>((resolve, reject) => {
    awsKMS.decrypt(
      {
        CiphertextBlob: readFileSync(`${encryptedDir}/${secretFileName}`),
      },
      (err, data) => {
        if (!err) {
          const decryptedScret = data['Plaintext'].toString();

          if (decryptedScret && decryptedScret.length) {
            log.info('Secret loaded successfully', { load: decryptedScret.length });
          } else {
            log.error('Error: secret not loaded', { err });
            reject(err);
          }

          resolve(decryptedScret);
        } else {
          log.error('Error: secret not loaded', { err });
          reject(err);
        }
      }
    );
  });
};
