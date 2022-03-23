import { MongoClient, Db } from 'mongodb';
import logger from '../../logger';
import { sleep } from '../../utils';
const log = logger.module('Database:mongo');

export class DBService {
  public db: Db;
  public mongoClient: MongoClient;
  private isInit = false;

  constructor() {}

  init = async () => {
    try {
      this.mongoClient = new MongoClient(process.env.DATABASE_URL);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(process.env.DATABASE_NAME);
      const res = await this.db.command({ ping: 1 });

      if (res.ok !== 1) {
        throw new Error('test ping failed');
      }

      this.isInit = true;

      log.info(`Start Database Service - ok`);
    } catch (e) {
      log.error('Error init DBService', { error: e });

      await sleep(5000);

      return await this.init();
    }
  };

  public insert = async (collectionName: string, data) => {
    if (!this.isInit) return;

    let collection = this.db.collection(collectionName);

    if (!collection) {
      collection = await this.db.createCollection(collectionName);
    }

    return await collection.insertOne(data);
  };

  public insertMany = async (collectionName: string, data: any[]) => {
    if (!this.isInit) return;

    let collection = this.db.collection(collectionName);

    if (!collection) {
      collection = await this.db.createCollection(collectionName);
    }

    return await collection.insertMany(data, { ordered: true });
  };

  public update = async (collectionName: string, filter: Record<string, any>, data: any) => {
    if (!this.isInit) return;

    let collection = this.db.collection(collectionName);

    if (!collection) {
      collection = await this.db.createCollection(collectionName);
    }

    return await collection.updateOne(filter, { $set: data }, { upsert: true });
  };

  public getCollectionCount = async (collectionName: string, filter?: Record<string, any>) => {
    if (!this.isInit) return 0;

    try {
      let collection = this.db.collection(collectionName);

      return await collection.count(filter);
    } catch (e) {
      log.error('Error getCollectionCount', { error: e });

      return 0;
    }
  };

  public find = async (collectionName: string, filter: Record<string, any>) => {
    if (!this.isInit) return null;

    let collection = this.db.collection(collectionName);

    if (!collection) {
      return null;
    }

    return await collection.findOne(filter);
  };

  public getCollectionData = async (
    collectionName: string,
    sort: Record<string, any> = null,
    limit,
    skip = 0,
    filter: Record<string, any> = null
  ): Promise<any> => {
    if (!this.isInit) return [];

    try {
      let collection = this.db.collection(collectionName);

      if (!limit) {
        return await collection.find(filter).sort(sort).collation({locale: "en_US", numericOrdering: true}).toArray();
      } else {
        return await collection.find(filter).sort(sort).collation({locale: "en_US", numericOrdering: true}).limit(limit).skip(skip).toArray();
      }
    } catch (e) {
      log.error('Error getCollectionData', { error: e });

      return [];
    }
  };

  public createIndexWithUniqueKey = async (collectionName: string, indexKey: string) => {
    try {
      log.info(`Start ${collectionName} index creating`, { collectionName });
      const start = Date.now();

      await this.db.createIndex(collectionName, { [indexKey]: 1 }, { unique: true });

      log.info(`End ${collectionName} index creating`, {  
        collectionName, 
        time: (Date.now() - start) / 1000 
      });
    } catch(e)  {
      log.error(`Error ${collectionName} index creating`, { error: e, collectionName });
    }
  }

  public copyCollectionByUniqueKey = async (
    oldCollection: string,  
    newCollection: string,
    indexKey: string
  ) => {
    try {
      log.info(`Start ${oldCollection} collection copy`, { 
        oldCollection, newCollection, indexKey 
      });
      const start = Date.now();

      const total = await this.getCollectionCount(oldCollection);

      let from = 0;
      const size = 100;

      while (from < total)  {
        const data = await this.getCollectionData(
          oldCollection,
          { opentime: -1 },
          size,
          from,
        );

        for(let i = 0; i< data.length; i++) {
          const record = data[i];

          await this.update(
            newCollection,
            { [indexKey]: record[indexKey] },
            {...record}
          );
        }

        from += size;
      }

      log.info(`End ${oldCollection} collection copy`, {  
        oldCollection, newCollection, indexKey,  
        time: (Date.now() - start) / 1000 
      });
    } catch(e)  {
      log.error(`Error ${oldCollection} collection copy`, { 
        error: e,  oldCollection, newCollection, indexKey 
      });
    }
  }
}

export const databaseService = new DBService();
