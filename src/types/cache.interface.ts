export interface ICache {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<string | null>;
  setWithExpiration: (key: string, value: string, expireTime: number) => Promise<string | null>;
  del: (key: string) => Promise<number>;
}