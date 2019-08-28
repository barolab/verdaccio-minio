import { Logger, Token, TokenFilter } from '@verdaccio/types';
import Client from './client';

const FILE_NAME = 'tokens.json';
interface TokenStorage {
  tokens: Record<string, Token>;
}

export default class Tokens {
  private client: Client;
  private logger: Logger;
  private cached: TokenStorage | null;

  public constructor(client: Client, logger: Logger) {
    this.client = client;
    this.logger = logger;
    this.cached = null;
  }

  public async get(filter: TokenFilter): Promise<Token[]> {
    const state = await this.load();
    const keys = Object.keys(state.tokens).filter(k => k.indexOf(filter.user) !== -1);

    return keys.map(k => state.tokens[k]);
  }

  public async add(token: Token): Promise<any> {
    const state = await this.load();
    const entry = `${token.user}:${token.key}`;
    const next = { tokens: { ...state.tokens, [entry]: token } };

    return await this.save(next);
  }

  public async remove(user: string, key: string): Promise<any> {
    const entry = `${user}:${key}`;
    const state = await this.load();
    const {
      tokens: { [entry]: unusedVar, ...next },
    } = state;

    return await this.save({ tokens: next });
  }

  /**
   * Custom function for loading tokens. If cached then we only return the cached
   * version, otherwise we load the tokens from the remote storage
   */
  private async load(): Promise<TokenStorage> {
    if (this.cached) {
      return this.cached as TokenStorage;
    }

    let db: TokenStorage;
    try {
      this.debug({}, '[Minio] Loading tokens in cache');
      const str = await this.client.get(FILE_NAME);

      this.debug({ str }, '[Minio] Got tokens from remote, @{str}');
      db = str === '' ? { tokens: {} } : JSON.parse(str);
    } catch (error) {
      this.debug({ error }, '[Minio] Failed to load tokens from remote storage, @{error}');
      throw new Error(`[Minio] Failed to load tokens from remote storage, ${error}`);
    }

    return db;
  }

  /**
   * Save the given tokens to the remote storage, and cache the result in memory if succeed
   *
   * @param db
   */
  private async save(db: TokenStorage): Promise<void> {
    try {
      this.debug({}, '[Minio] Saving cached tokens to storage');
      const res = await this.client.put(FILE_NAME, JSON.stringify(db));
      this.debug({ res }, '[Minio] tokens stored successfully, @{res}');
      this.cached = db;
    } catch (error) {
      this.debug({ error }, '[Minio] Failed to store tokens to remote storage, @{error}');
      throw new Error(`[Minio] Failed to store tokens to remote storage, ${error}`);
    }
  }

  private debug(conf: any, template: string): void {
    this.logger.debug(conf, template);
  }
}
