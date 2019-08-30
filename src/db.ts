import { LocalStorage, Logger } from '@verdaccio/types';
import { isNotFound } from './errors';
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
    try {
      this.debug({}, 'Loading current secret');
      const state = await this.load();
      this.debug({}, 'Secret loaded successfully');
      return state.secret;
    } catch (error) {
      throw new Error(`Failed to load the secret, ${error}`);
    }
  }

  /**
   * Update the secret in the database
   *
   * @param secret
   */
  public async setSecret(secret: string): Promise<void> {
    try {
      this.debug({}, 'Saving a new secret');
      const state = await this.load();
      const next = { ...state, secret: secret };
      await this.save(next);
      this.debug({}, 'Saved a new secret');
    } catch (error) {
      throw new Error(`Failed to save a new secret, ${error}`);
    }
  }

  /**
   * Search for packages based on the validation function
   *
   * @param validate
   */
  public async search(validate: (name: string) => boolean): Promise<string[]> {
    try {
      this.debug({}, 'Searching for some packages');
      const state = await this.load();
      const result = state.list.filter(validate);
      this.debug({ result }, 'Got some packages that match the filter, @{result}');
      return result;
    } catch (error) {
      throw new Error(`Failed to search for packages, ${error}`);
    }
  }

  /**
   * Get all the packages in the database
   */
  public async get(): Promise<string[]> {
    try {
      this.debug({}, 'Loading all the packages');
      const state = await this.load();
      const result = state.list;
      this.debug({ result }, 'Got all the packages, @{result}');
      return result;
    } catch (error) {
      throw new Error(`Failed to load all the packages, ${error}`);
    }
  }

  /**
   * Add the given package to the database
   *
   * @param name
   */
  public async add(name: string): Promise<void> {
    try {
      this.debug({ name }, 'Adding package @{name}');
      const state = await this.load();
      if (state.list.indexOf(name) > -1) {
        this.debug({ name }, 'Package @{name} already exist');
        return;
      }

      const next = { ...state, list: [...state.list, name] };
      await this.save(next);
      this.debug({ name }, 'Package @{name} successfully added');
    } catch (error) {
      throw new Error(`Failed to add package, ${error}`);
    }
  }

  /**
   * Remove the given package from the database
   *
   * @param name
   */
  public async remove(name: string): Promise<void> {
    try {
      this.debug({ name }, 'Removing package @{name}');
      const state = await this.load();
      if (state.list.indexOf(name) === -1) {
        this.debug({ name }, 'Package @{name} does not exist, cannot remove it');
        return;
      }

      const next = { ...state, list: state.list.filter(p => p !== name) };
      await this.save(next);
      this.debug({ name }, 'Package @{name} successfully removed');
    } catch (error) {
      throw new Error(`Failed to remove package, ${error}`);
    }
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
      this.debug({ name: FILE_NAME }, 'Loading database @{name} from cache');
      const str = await this.client.get(FILE_NAME);

      this.debug({ str }, 'Got database from remote, @{str}');
      db = str === '' ? { list: [], secret: '' } : JSON.parse(str);
    } catch (error) {
      if (isNotFound(error)) {
        this.debug({}, 'Database does not exist yet in storage, initializing it');
        db = { list: [], secret: '' };
      } else {
        this.debug({ error }, 'Failed to load database from remote storage, @{error}');
        throw new Error(`Failed to load database from remote storage, ${error}`);
      }
    }

    return db;
  }

  /**
   * Save the given database to the remote storage, and cache the result in memory if succeed
   *
   * @param db
   */
  private async save(db: LocalStorage): Promise<void> {
    try {
      this.debug({}, 'Saving cached database to storage');
      const res = await this.client.put(FILE_NAME, JSON.stringify(db));
      this.debug({ res }, 'Database stored successfully, @{res}');
      this.cached = db;
    } catch (error) {
      this.debug({ error }, 'Failed to store database to remote storage, @{error}');
      throw new Error(`Failed to store database to remote storage, ${error}`);
    }
  }

  private debug(conf: object, template: string): void {
    this.logger.debug(conf, `[Minio] ${template}`);
  }
}
