import mongoose from 'mongoose';
import { createClient } from 'redis';
import { config } from '../config';
import { ICache } from '../types/cache.interface'

export class RedisClient {
  private static _instance: ReturnType<typeof createClient>;

  private constructor() { }

  static getClient() {
    if (!RedisClient._instance) {
      let client = RedisClient._instance = createClient({
        url: config.REDIS_URL
      });
      client.on('error', (error) => console.log('Redis client error', error));
    }

    return RedisClient._instance;
  }
}

async function connectToDb() {
  try {
    mongoose.set('strictQuery', false);
    const mongoUriAndDb = getMongoUriFromConfig();
    console.log(mongoUriAndDb);
    await mongoose.connect(mongoUriAndDb);
    console.log('Conected to db');
  } catch (error) {
    console.error('Connection error', error);
    throw error;
  }
}

function getMongoUriFromConfig() {
  const { MONGO_DB_NAME, MONGO_URI } = config;
  return `${MONGO_URI}/${MONGO_DB_NAME}`;
}

export default connectToDb;