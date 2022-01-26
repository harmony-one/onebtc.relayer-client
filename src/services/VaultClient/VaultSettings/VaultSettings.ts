import {DataLayerService} from "../../common";

const defaultConfig = {
  hmyPrivateKey: '',
  btcPrivateKey: '',
}

const defaultKey = 'default';

export interface VaultSettings {
  hmyPrivateKey: string;
  btcPrivateKey: string;
}

export class VaultSettingService extends DataLayerService<VaultSettings> {

  getSettings(): Promise<null | VaultSettings> {
    // @ts-ignore
    return this.find(defaultKey);
  }

  async updateSettings(newSettings: VaultSettings) {
    const prevConfig = await this.getSettings();

    return this.updateOrCreateData({
      id: defaultKey,
      ...prevConfig,
      ...newSettings,
    });
  }

  async start() {
    const data = await this.getSettings();

    if (data) {
      return true;
    }

    await this.updateSettings(defaultConfig);

    return true;
  }
}