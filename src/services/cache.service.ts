import { ICache } from "../types/cache.interface";

export class CacheService implements ICache {
  constructor(private cacheClient: ICache) {

  }
  async get(key: string) {
    try {
      const value = await this.cacheClient.get(key);
      return value;
    } catch (error) {
      console.error(`Cache retrievel attempt failed for key: ${key}`);
      console.error(error);
      return null;
    }
  }

  async set(key: string, value: string) {
    try {
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
      return await this.cacheClient.del(key);
    } catch (error) {
      console.error(`Cache delete attempt failed for key: ${key}`);
      console.error(error);
      return 1;
    }
  }
}