import { LocalStorage, Logger } from '@verdaccio/types';
import Client from './client';

const FILE_NAME = 'db.json';

/**
 * Database of Verdaccio. It's actually pretty simple as it only contains a secret
 * and a list of packages stored in Verdaccio.
 *
 * This implementation wrap the minio client to provide high-level methods for managing
 * the database, with lots of Debug output & some decorated errors.
 */
export default class Database {
  private client: Client;
  private logger: Logger;
  private cached: LocalStorage | null;

  public constructor(client: Client, logger: Logger) {
    this.client = client;
    this.logger = logger;
    this.cached = null;
  }

  /**
   * Get the secret from the database
   */
  public async getSecret(): Promise<string> {
    const state = await this.load();

    return state.secret;
  }

  /**
   * Update the secret in the database
   *
   * @param secret
   */
  public async setSecret(secret: string): Promise<void> {
    const state = await this.load();
    const next = { ...state, secret: secret };

    await this.save(next);
  }

  /**
   * Search for packages based on the validation function
   *
   * @param validate
   */
  public async search(validate: (name: string) => boolean): Promise<string[]> {
    const state = await this.load();

    return state.list.filter(validate);
  }

  /**
   * Get all the packages in the database
   */
  public async get(): Promise<any> {
    const state = await this.load();

    return state.list;
  }

  /**
   * Add the given package to the database
   *
   * @param name
   */
  public async add(name: string): Promise<void> {
    const state = await this.load();
    if (state.list.indexOf(name) >= -1) {
      this.debug({ name }, 'Minio: Package @{name} already exist in database');
      return;
    }

    const next = { ...state, list: [...state.list, name] };
    await this.save(next);
  }

  /**
   * Remove the given package from the database
   *
   * @param name
   */
  public async remove(name: string): Promise<void> {
    const state = await this.load();
    if (state.list.indexOf(name) === -1) {
      this.debug({ name }, 'Minio: Package @{name} does not exist in database, cannot remove it');
      return;
    }

    const next = { ...state, list: state.list.filer(p => p !== name) };
    await this.save(next);
  }

  /**
   * Custom function for loading database. If cached then we only return the cached
   * version, otherwise we load the database from the remote storage
   */
  private async load(): Promise<LocalStorage> {
    if (this.cached) {
      return this.cached as LocalStorage;
    }

    let db: LocalStorage;
    try {
      this.debug({}, 'Minio: Loading database in cache');
      const str = await this.client.get(FILE_NAME);

      this.debug({ str }, 'Minio: Got database from remote, @{str}');
      db = str === '' ? { list: [], secret: '' } : JSON.parse(str);
    } catch (error) {
      throw new Error(`Minio: Failed to load database from remote storage, ${error}`);
    }

    return Promise.resolve(db);
  }

  /**
   * Save the given database to the remote storage, and cache the result in memory if succeed
   *
   * @param db
   */
  private async save(db: LocalStorage): Promise<void> {
    try {
      this.debug({}, 'Minio: Saving cached database to storage');
      const res = await this.client.put(FILE_NAME, JSON.stringify(db));
      this.debug({ res }, 'Minio: Database stored successfully, @{res}');
      this.cached = db;
    } catch (error) {
      throw new Error(`Minio: Failed to store database to remote storage, ${error}`);
    }
  }

  private debug(conf: any, template: string): void {
    this.logger.debug(conf, template);
  }
}
