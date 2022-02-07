import inquirer from 'inquirer';
import {VaultSettingService} from "../VaultSettings/VaultSettings";
import {decryptMsg, encryptMsg} from "./crypt";
import {IServices} from "../../init_vault";
import logger from "../../../logger";

const log = logger.module('KeyStorage');

export let PASSWORD = '';

export const loadFromDatabase = async (dbKey: string, services: IServices) => {
  const settings = await services.vaultDbSettings.getSettings();

  const keys = JSON.parse(decryptMsg(settings.keys, PASSWORD));

  return keys[dbKey];
}

const validateNotEmpty = async (input) => {
  if (input) {
    return true;
  }

  return 'should be not empty'
}

const requestSettingsPrompt = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      message: 'Enter password to encrypt your private keys',
      name: 'password',
      validate: validateNotEmpty,
    },
    {
      type: 'password',
      message: 'Enter Harmony Private Key',
      name: 'hmyPrivateKey',
      validate: validateNotEmpty,
    },
    {
      type: 'password',
      message: 'Enter Bitcoin Private Key',
      name: 'btcPrivateKey',
      validate: validateNotEmpty,
    },
  ]);

  return answers;
}

enum START_MODE {
  ENTER_PASSWORD = 'enterPassword',
  RESET_PASSWORD = 'resetPassword'
}

const requestPassOrRecover = async (): Promise<START_MODE> => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      message: 'Start application',
      choices: [
        {
          name: 'Enter encryption password and load private keys from db',
          value: START_MODE.ENTER_PASSWORD
        },
        {
          name: 'Reset encryption password (all private keys also will be deleted)',
          value: START_MODE.RESET_PASSWORD
        }
      ],
      default: START_MODE.ENTER_PASSWORD,
      name: 'reset',
    },
  ]);

  return answers.reset;
}

const requestPassword = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      message: 'Enter encryption password and load private keys from db',
      name: 'password',
    },
  ]);

  return answers;
}

const resetPasswordAndKeys = async (vaultSettingService: VaultSettingService) => {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      message: 'Reset encryption password and all private keys?',
      default: false,
      name: 'reset'
    },
  ]);

  if (answers.reset) {
    await vaultSettingService.updateSettings({
      keys: '',
    })
  }

  return answers;
}

export const checkAndInitDbPrivateKeys = async (vaultSettingService: VaultSettingService) => {
  console.log('You are loading Vault in the database-store private keys mode');
  console.log('All private keys will be encrypted with a password');

  const settings = await vaultSettingService.getSettings();

  // if PK already exist
  if (settings.keys) {
    const option = await requestPassOrRecover();

    if (option === START_MODE.ENTER_PASSWORD) {
      const {password} = await requestPassword();
      PASSWORD = password;

      try {
        const keys = JSON.parse(decryptMsg(settings.keys, PASSWORD));

        if (keys.hmyPrivateKey && keys.btcPrivateKey) {
          return keys;
        }

        log.error('\nEncryption password is wrong\n');
        return checkAndInitDbPrivateKeys(vaultSettingService);
      } catch (ex) {
        log.error('\nEncryption password is wrong\n');
        return checkAndInitDbPrivateKeys(vaultSettingService);
      }

    }

    if (option === START_MODE.RESET_PASSWORD) {
      await resetPasswordAndKeys(vaultSettingService);
      return await checkAndInitDbPrivateKeys(vaultSettingService);
    }

    throw new Error('Unhandled start option');
  }

  // Setup PK
  const {password, hmyPrivateKey, btcPrivateKey} = await requestSettingsPrompt();

  const keys = encryptMsg(JSON.stringify({
    hmyPrivateKey,
    btcPrivateKey,
  }), password);

  await vaultSettingService.updateSettings({
    keys,
  });

  PASSWORD = password;

  return {
    hmyPrivateKey,
    btcPrivateKey,
  };
}
