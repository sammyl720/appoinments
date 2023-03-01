export interface ICache {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<string | null>;
  del: (key: string) => Promise<number>;
}