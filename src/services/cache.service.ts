import { RedisClient } from "../db/database";
import { ICache } from "../types/cache.interface";

export class NoOpCache implements ICache {
  get(key: string) {
    return Promise.resolve(null);
  }

  set(key: string, value: string) {
    return Promise.resolve(null);
  }

  del(key: string) {
    return Promise.resolve(0);
  }
}

export class CacheService implements ICache {

  constructor(private cacheClient: ICache, private disable = process.env.ENABLE_CACHE !== 'true') {

  }
  async get(key: string) {
    try {
      if (this.disable) {
        return null;
      }
      console.log("Attempting cache retrieval for: ", key);
      const value = await this.cacheClient.get(key);
      if (!!value) {
        console.log(`Cache hit for key '${key}'`)
      }
      return value;
    } catch (error) {
      console.error(`Cache retrievel attempt failed for key: ${key}`);
      console.error(error);
      return null;
    }
  }

  async set(key: string, value: string) {
    try {
      if (this.disable) return null;
      console.log(`Adding key: ${key} with value ${value} to cache`)
      const result = await this.cacheClient.set(key, value);
      return result;
    } catch (error) {
      console.error(`Cache set attempt failed for key: ${key}, value: ${value}`);
      console.error(error);
      return null;
    }
  }

  async setWithExpiration(key: string, value: string, expireTime: number) {
    try {
      if (this.disable) return null;
      // @ts-ignore
      const result = await this.cacheClient.set(key, value, 'EX', expireTime);
      return result;
    } catch (error) {
      console.error(`Cache set attempt failed for key: ${key}, value: ${value}`);
      console.error(error);
      return null;
    }
  }

  async del(key: string) {
    try {
      if (this.disable) return 0;
      return await this.cacheClient.del(key);
    } catch (error) {
      console.error(`Cache delete attempt failed for key: ${key}`);
      console.error(error);
      return 1;
    }
  }

  clear() {
    if (this.cacheClient instanceof RedisClient) {
      (this.cacheClient as RedisClient).clear()
    }
    else {
      try {
        // @ts-ignore
        this.cacheClient.flushAll()
      } catch (error) {
        console.error(error);
      }
    }
  };
}