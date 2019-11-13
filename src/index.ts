import {
  Logger,
  Config,
  Callback,
  Token,
  TokenFilter,
  PluginOptions,
  IPackageStorage,
  IPluginStorage,
} from '@verdaccio/types';

import retry, { RetryFunction } from './async';
import { PluginConfig } from './config';
import Database from './db';
import Storage from './storage';
import Tokens from './tokens';
import Client from './client';

export default class MinioDatabase implements IPluginStorage<PluginConfig> {
  public version = '0.1.0-alpha';
  public logger: Logger;
  public config: PluginConfig;

  private client: Client;
  private tokens: Tokens;
  private db: Database;
  private retry: RetryFunction;

  public constructor(config: Config, options: PluginOptions<PluginConfig>) {
    this.retry = retry({
      log: msg => options.logger.debug({}, `[Minio] ${msg}`),
      delay: config.delay || 500, // 0.5 sec
      retries: config.retries || 10,
    });

    this.logger = options.logger;
    this.config = { ...config.store.minio };
    this.client = new Client(this.config, this.logger);
    this.tokens = new Tokens(this.client, this.logger);
    this.db = new Database(this.client, this.logger);

    this.client.initialize().catch(error => {
      this.logger.error({ error }, 'There was an error initializing client: @{error}');
    });
  }

  public search(onPackage: Callback, onEnd: Callback, validate: (name: string) => boolean): void {
    this.retry(() => this.db.search(validate))
      .then(results => Promise.all(results.map(r => this.stat(r, onPackage))))
      .then(() => onEnd(null))
      .catch(error => onEnd(error));
  }

  public get(callback: Function): void {
    this.retry(() => this.db.get())
      .then(packages => callback(null, packages))
      .catch(error => callback(error, []));
  }

  public add(name: string, callback: Function): void {
    this.retry(() => this.db.add(name))
      .then(() => callback(null))
      .catch(error => callback(error));
  }

  public remove(name: string, callback: Function): void {
    this.retry(() => this.db.remove(name))
      .then(() => callback(null))
      .catch(error => callback(error));
  }

  public getSecret(): Promise<string> {
    return this.retry(() => this.db.getSecret());
  }

  public setSecret(secret: string): Promise<void> {
    return this.retry(() => this.db.setSecret(secret));
  }

  public readTokens(filter: TokenFilter): Promise<Token[]> {
    return this.retry(() => this.tokens.get(filter));
  }

  public saveToken(token: Token): Promise<void> {
    return this.retry(() => this.tokens.add(token));
  }

  public deleteToken(user: string, key: string): Promise<void> {
    return this.retry(() => this.tokens.remove(user, key));
  }

  public getPackageStorage(name: string): IPackageStorage {
    return new Storage(this.client, this.logger, name);
  }

  private async stat(name: string, onPackage: Callback): Promise<void> {
    const stat = await this.retry(() => this.client.stat(name));
    onPackage(stat);
  }
}
