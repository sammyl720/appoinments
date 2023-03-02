export interface ICache {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, command?: 'EX', expireTime?: number) => Promise<string | null>;
  del: (key: string) => Promise<number>;
}