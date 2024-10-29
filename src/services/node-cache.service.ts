import { ICache } from "../types/cache.interface";
import NodeCache from "node-cache";

export class NodeCacheAdapter implements ICache {
    private cache: NodeCache;
  
    constructor(ttlSeconds: number = 60) {
      this.cache = new NodeCache({ stdTTL: ttlSeconds });
    }
  
    async get(key: string): Promise<string | null> {
      const value = this.cache.get<string>(key);
      return value ?? null;
    }
  
    async set(key: string, value: string): Promise<string | null> {
      this.cache.set(key, value);
      return value;
    }
  
    async setWithExpiration(key: string, value: string, expireTime: number): Promise<string | null> {
      this.cache.set(key, value, expireTime);
      return value;
    }
  
    async del(key: string): Promise<number> {
      return this.cache.del(key);
    }
  
    async clear(): Promise<void> {
      this.cache.flushAll();
    }
  }