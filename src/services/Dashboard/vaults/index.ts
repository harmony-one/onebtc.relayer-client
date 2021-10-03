import EventEmitter = require('events');
import { DBService } from '../../database';
import { IRegisterVaultEvent, IVaultRegistry } from '../common/interfaces';
import { DataLayerService } from '../common/DataLayerService';

import logger from '../../../logger';
const log = logger.module('Vaults:main');

export interface IVaultsService {
  database: DBService;
  dbCollectionPrefix: string;
  eventEmitter: EventEmitter;
  contractAddress: string;
  contractAbi: any[];
}

export class VaultsService extends DataLayerService<IVaultRegistry> {
  waitInterval = Number(process.env.WAIT_INTERVAL) || 1000;
  eventEmitter: EventEmitter;

  constructor(params: IVaultsService) {
    super(params);

    this.eventEmitter = params.eventEmitter;
    this.eventEmitter.on('RegisterVault', this.addVault);
  }

  async start() {
    try {
      const data = await this.loadAllData();
      data.forEach(item => this.observableData.set(item.id, item));

      setTimeout(this.syncVaults, 100);

      log.info(`Start Vaults Service - ok`);
    } catch (e) {
      log.error(`Start Vault`, { error: e });
      throw new Error(`Start Vault: ${e.message}`);
    }
  }

  addVault = async (data: IRegisterVaultEvent) => {
    try {
      const vaultId = data.returnValues.vaultId;

      // TODO: if next string fail - vault will lost
      const vaultInfo = await this.contract.methods.vaults(vaultId).call();
      const vault = { ...vaultInfo, id: vaultId };

      await this.updateOrCreateData(vault);

      this.observableData.set(vaultId, vault);
    } catch (e) {
      log.error(`Error addVault`, { error: e, data });
    }
  };

  syncVaults = async () => {
    try {
      // TODO: next requests not parallel - need to optimise fro 20+ items
      for (let vaultId of this.observableData.keys()) {
        try {
          const vaultInfo = await this.contract.methods.vaults(vaultId).call();
          const updVault = { ...vaultInfo, id: vaultId };

          this.observableData.set(updVault.id, updVault);
          await this.updateOrCreateData(updVault);
        } catch (e) {
          log.error('Error update Vault', { error: e, vaultId });
        }
      }

      this.lastUpdate = Date.now();
    } catch (e) {
      log.error('Error syncVaults', { error: e });
    }

    setTimeout(this.syncVaults, this.waitInterval);
  };
}
