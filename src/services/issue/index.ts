import EventEmitter = require('events');
import { DataLayerService, ILogEventsService } from '../common/DataLayerService';
import { IssueRequest, IssueRequestEvent } from '../common/interfaces';

import logger from '../../logger';
const log = logger.module('Issues:main');

export interface IIssueService extends ILogEventsService {
  eventEmitter: EventEmitter;
  eventName: string;
  methodName: string;
  idEventKey: string;
}

export class IssueService extends DataLayerService<IssueRequest> {
  eventEmitter: EventEmitter;
  waitInterval = Number(process.env.WAIT_INTERVAL) || 1000;
  eventName: string;
  methodName: string;
  idEventKey: string;

  constructor(params: IIssueService) {
    super(params);

    this.eventEmitter = params.eventEmitter;

    this.eventName = params.eventName;
    this.methodName = params.methodName;
    this.idEventKey = params.idEventKey;
    this.eventEmitter.on(params.eventName, this.addIssue);
  }

  async start() {
    try {
      const data = await this.getData({
        size: 1000,
        page: 0,
        filter: { status: '1' },
        sort: { opentime: -1 }
      });

      data.content.forEach(item => this.observableData.set(item.id, item));

      setTimeout(this.syncData, 100);

      log.info(`Start ${this.eventName} Service - ok`);
    } catch (e) {
      log.error(`Start ${this.eventName}`, { error: e });
      throw new Error(`Start ${this.eventName}: ${e.message}`);
    }
  }

  addIssue = async (data: IssueRequestEvent) => {
    try {
      const { requester } = data.returnValues;
      const id = data.returnValues[this.idEventKey];

      // TODO: if next string fail - issue will lost
      const issueInfo = await this.contract.methods[this.methodName](requester, id).call();
      const issue = { ...issueInfo, id };

      await this.updateOrCreateData(issue);

      if (issue.status === '1') {
        this.observableData.set(id, issue);
      }
    } catch (e) {
      log.error(`Error addIssue`, { error: e, data });
    }
  };

  syncData = async () => {
    try {
      // TODO: next requests not parallel - need to optimise fro 20+ items
      for (let item of this.observableData.values()) {
        try {
          const { requester, id } = item;

          const issueInfo = await this.contract.methods[this.methodName](requester, id).call();
          const issueUpd = { ...issueInfo, id };

          await this.updateOrCreateData(issueUpd);

          if (issueUpd.status !== '1') {
            this.observableData.delete(id);
          }
        } catch (e) {
          log.error('Error update Vault', { error: e, issue: item });
        }
      }

      this.lastUpdate = Date.now();
    } catch (e) {
      log.error('Error syncVaults', { error: e });
    }

    setTimeout(this.syncData, this.waitInterval);
  };
}
