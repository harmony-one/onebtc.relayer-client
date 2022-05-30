import EventEmitter = require('events');
import { IServices } from '../init';
import { DataLayerService, ILogEventsService } from '../common';

import logger from '../../logger';
import { getDatesLastMonth } from './helpers';
import moment = require('moment');
import { sleep } from '../../utils';
const log = logger.module('History:main');

export interface IHistoryService extends ILogEventsService {
  eventEmitter: EventEmitter;
  services: IServices;
}

interface ISyncConfig {
  getData: any;
  field: string;
  dbCollection: string;
  totalAmount: number;
  lastSyncDate: number;
}

export class HistoryService extends DataLayerService<any> {
  eventEmitter: EventEmitter;
  services: IServices;

  redeemSyncConfig: ISyncConfig;
  issueSyncConfig: ISyncConfig;

  waitInterval = Number(process.env.WAIT_INTERVAL) || 1000;

  dbCollectionPrefix = 'history';

  constructor(params: IHistoryService) {
    super(params);

    this.eventEmitter = params.eventEmitter;
    this.services = params.services;

    this.redeemSyncConfig = {
      getData: this.services.redeems.getData,
      field: 'amountBtc',
      dbCollection: 'redeemed_new',
      totalAmount: 0,
      lastSyncDate: 0,
    };

    this.issueSyncConfig = {
      getData: this.services.issues.getData,
      field: 'amount',
      dbCollection: 'issued_new',
      totalAmount: 0,
      lastSyncDate: 0,
    };
  }

  async start() {
    try {
      setTimeout(this.syncVaults, 100);
      setTimeout(() => this.syncOperations(this.issueSyncConfig), 100);
      setTimeout(() => this.syncOperations(this.redeemSyncConfig), 100);

      log.info(`Start History Service - ok`);
    } catch (e) {
      log.error(`Start History Service`, { error: e });
      throw new Error(`Start History Service: ${e.message}`);
    }
  }

  waitFullSync = async () => {
    while (this.services.onebtcEvents.getProgress() !== '1.00') {
      await sleep(1000);
    }
  };

  syncOperations = async (config: ISyncConfig) => {
    try {
      await this.waitFullSync();

      let current = config.lastSyncDate;

      if (!current) {
        const res = await config.getData({ 
          size: 1, 
          sort: { opentime: 1 }, 
          filter: { status: '2' } 
        });

        if(!res.content[0]) {
          return;
        }

        const firstIssueTime = res.content[0].opentime * 1000;
        current = moment.utc(moment(firstIssueTime).format('YYYY-MM-DD')).unix();
      }

      const now = moment().unix();

      while (current < now) {
        const end = current + 3600 * 24;

        const res = await config.getData({
          filter: { opentime: { $gte: String(current), $lt: String(end) } },
        });

        const amountPerDay = res.content.reduce((acc, data) => acc + Number(data[config.field]), 0);
        config.totalAmount += amountPerDay;

        const collection = `${this.dbCollectionPrefix}_${config.dbCollection}`;
        const date = new Date(current * 1000).toISOString();
        await this.database.update(
          collection,
          { date },
          { amountPerDay, total: config.totalAmount, date, dateTimestamp: current }
        );

        current = end;
        config.lastSyncDate = end;
      }
    } catch (e) {
      log.error('Error syncIssues', { error: e });
    }

    setTimeout(() => this.syncOperations(config), this.waitInterval);
  };

  syncVaults = async () => {
    try {
      const res = await this.services.vaults.getData({});
      const vaults = res.content;
      const activeVaults = vaults.filter(v => v.lastPing && Date.now() - v.lastPing < 120000);

      const collection = `${this.dbCollectionPrefix}_vaults`;
      const date = new Date().toISOString().split(':')[0] + ':00:00Z';
      const totalCollateral = vaults.reduce((acc, v) => acc + Number(v.collateral), 0);

      await this.database.update(
        collection,
        { date },
        { vaults: vaults.length, activeVaults: activeVaults.length, totalCollateral, date }
      );
    } catch (e) {
      log.error('Error syncData', { error: e });
    }

    setTimeout(this.syncVaults, this.waitInterval);
  };

  getHistoryData = async (params, step) => {
    if (step === 'd') {
      return await this.getData({
        ...params,
        filter: { date: { $in: getDatesLastMonth() } },
      });
    }

    return await this.getData(params);
  };

  getHistoryWeekData = async (params: {collectionName: string}) => {
    const collectionName = params.collectionName || `${this.dbCollectionPrefix}_data`;
    const collection = this.database.db.collection(collectionName);

    const data = await collection.aggregate([
      {
        "$project": {
          "week": { "$week": {'$toDate': "$date"} },
          "amountPerDay": "$amountPerDay",
          "date": "$date",
          "total": "$total",
          "dateTimestamp": "$dateTimestamp"
        }
      },
      {
        "$group": {
          "_id": "$week",
          "amountPerWeek": { "$sum": "$amountPerDay" },
          "date": {"$last": "$date"},
          "total": {"$last": "$total"},
          "dateTimestamp": {"$last": "$dateTimestamp"}
        }
      },
      {"$sort": {"dateTimestamp": -1}}
    ]).toArray();

    return {
      content: data,
      totalElements: 0,
      totalPages: 0,
      size: 0,
      page: 0
    }
  }

  getHistoryMonthData = async (params: {collectionName: string}) => {
    const collectionName = params.collectionName || `${this.dbCollectionPrefix}_data`;
    const collection = this.database.db.collection(collectionName);

    const data = await collection.aggregate([
      {
        "$project": {
          "week": { "$month": {'$toDate': "$date"} },
          "amountPerDay": "$amountPerDay",
          "date": "$date",
          "total": "$total",
          "dateTimestamp": "$dateTimestamp"
        }
      },
      {
        "$group": {
          "_id": "$month",
          "amountPerMonth": { "$sum": "$amountPerDay" },
          "date": {"$last": "$date"},
          "total": {"$last": "$total"},
          "dateTimestamp": {"$last": "$dateTimestamp"}
        }
      },
      {"$sort": {"dateTimestamp": -1}}
    ]).toArray();

    return {
      content: data,
      totalElements: 0,
      totalPages: 0,
      size: 0,
      page: 0
    }
  }
}
