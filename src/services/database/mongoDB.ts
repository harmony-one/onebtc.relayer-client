import { MongoClient, Db } from 'mongodb';
import logger from '../../logger';
const log = logger.module('Database:mongo');

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;

export class DBService {
  public db: Db;
  public mongoClient: MongoClient;
  private isInit = false;

  constructor() {}

  init = async () => {
    try {
      this.mongoClient = new MongoClient(DATABASE_URL);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(DATABASE_NAME);
      const res = await this.db.command({ ping: 1 });

      if (res.ok !== 1) {
        throw new Error('test ping failed');
      }

      this.isInit = true;
    } catch (e) {
      log.error('Error init DBService', { error: e });
    }
  };

  public insert = async (collectionName: string, data) => {
    let collection = this.db.collection(collectionName);

    if (!collection) {
      collection = await this.db.createCollection(collectionName);
    }

    return await collection.insertOne(data);
  };

  public insertMany = async (collectionName: string, data: any[]) => {
    let collection = this.db.collection(collectionName);

    if (!collection) {
      collection = await this.db.createCollection(collectionName);
    }

    return await collection.insertMany(data, { ordered: true });
  };

  public update = async (collectionName: string, filter: Record<string, any>, data: any) => {
    let collection = this.db.collection(collectionName);

    if (!collection) {
      collection = await this.db.createCollection(collectionName);
    }

    return await collection.updateOne(filter, { $set: data }, { upsert: true });
  };

  public getCollectionCount = async (collectionName: string) => {
    try {
      let collection = this.db.collection(collectionName);

      return await collection.count();
    } catch (e) {
      log.error('Error getCollectionCount', { error: e });

      return 0;
    }
  };

  public find = async (collectionName: string, filter: Record<string, any>) => {
    let collection = this.db.collection(collectionName);

    if (!collection) {
      return null;
    }

    return await collection.findOne(filter);
  };

  public getCollectionData = async (
    collectionName: string,
    orderBy?: string,
    limit = 100,
    skip = 0,
    filter: Record<string, any> = null
  ): Promise<any> => {
    try {
      let collection = this.db.collection(collectionName);

      return await collection
        .find(filter)
        .sort({ [orderBy]: 1 })
        .limit(limit)
        .skip(skip)
        .toArray();
    } catch (e) {
      log.error('Error getCollectionData', { error: e });

      return [];
    }
  };
}

export const databaseService = new DBService();
