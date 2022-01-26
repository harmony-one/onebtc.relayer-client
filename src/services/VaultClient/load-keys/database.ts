import inquirer from 'inquirer';
import {VaultSettingService} from "../VaultSettings/VaultSettings";
import {decryptMsg, encryptMsg} from "./crypt";
import {IServices} from "../../init_vault";

export let PASSWORD = '';

export const loadFromDatabase = async (dbKey: string, services: IServices) => {
  const settings = await services.vaultDbSettings.getSettings();

  return decryptMsg(settings[dbKey], PASSWORD);
}

const requestSettingsPrompt = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      message: 'Enter Harmony Private Key',
      name: 'harmonyPK'
    },
    {
      type: 'password',
      message: 'Enter Bitcoin Private Key',
      name: 'bitcoinPK'
    },
    {
      type: 'password',
      message: 'Enter a password',
      name: 'password',
    },
    {
      type: 'password',
      message: 'Repeat a password',
      name: 'passwordConfirm',
    },
  ]);

  return answers;
}

const requestPassword = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      message: 'Enter a password',
      name: 'password',
    },
  ]);

  return answers;
}

const resetPasswordAndKeys = async (vaultSettingService: VaultSettingService) => {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      message: 'Reset password?',
      default: false,
      name: 'reset'
    },
  ]);

  if (answers.reset) {
    await vaultSettingService.updateSettings({
      hmyPrivateKey: '',
      btcPrivateKey: '',
    })
  }

  return answers;
}

export const checkAndInitDbPrivateKeys = async (vaultSettingService: VaultSettingService) => {
  const settings = await vaultSettingService.getSettings();

  // if PK already exist
  if (settings.hmyPrivateKey && settings.btcPrivateKey) {
    const {password} = await requestPassword();

    if (!password) {
      await resetPasswordAndKeys(vaultSettingService);
      await checkAndInitDbPrivateKeys(vaultSettingService);
      return;
    }
    PASSWORD = password;
    return;
  }

  // Setup PK
  const {password, harmonyPK, bitcoinPK} = await requestSettingsPrompt();

  const hmyPrivateKey = encryptMsg(harmonyPK, password);
  const btcPrivateKey = encryptMsg(bitcoinPK, password);

  await vaultSettingService.updateSettings({
    hmyPrivateKey,
    btcPrivateKey,
  });

  PASSWORD = password;

  return;
}