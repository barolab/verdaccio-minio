import { Logger, Config, Token, TokenFilter, PluginOptions, IPackageStorage, IPluginStorage } from '@verdaccio/types';
import { PluginConfig } from './config';
import Database from './db';
import Client from './client';

export default class MinioDatabase implements IPluginStorage<PluginConfig> {
  public version = '0.1.0-alpha';
  public logger: Logger;
  public config: PluginConfig;

  private client: Client;
  private db: Database;

  public constructor(config: Config, options: PluginOptions<PluginConfig>) {
    if (!config) {
      throw new Error('Minio storage is missing config. Add a `store.minio-storage` section to your config file');
    }

    this.logger = options.logger;
    this.config = { ...config.store['minio-storage'] };
    this.client = new Client(this.config, this.logger);
    this.db = new Database(this.client, this.logger);

    this.client.initialize().catch(error => {
      throw new Error(`There was an error initializing client: ${error}`);
    });
  }

  public search(onPackage: Function, onEnd: Function, validate: Function): void {
    throw new Error('Method not implemented.');
  }

  public get(callback: Function): void {
    this.db
      .get()
      .then(packages => callback(null, packages))
      .catch(error => callback(error, []));
  }

  public add(name: string, callback: Function): void {
    this.db
      .add(name)
      .then(() => callback(null))
      .catch(error => callback(error));
  }

  public remove(name: string, callback: Function): void {
    this.db
      .remove(name)
      .then(() => callback(null))
      .catch(error => callback(error));
  }

  public getSecret(): Promise<string> {
    return this.db.getSecret();
  }

  public setSecret(secret: string): Promise<any> {
    return this.db.setSecret(secret);
  }

  public readTokens(filter: TokenFilter): Promise<Token[]> {
    throw new Error('Method not implemented.');
  }

  public saveToken(token: Token): Promise<any> {
    throw new Error('Method not implemented.');
  }

  public deleteToken(user: string, key: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  public getPackageStorage(info: string): IPackageStorage {
    throw new Error('Method not implemented.');
  }
}
