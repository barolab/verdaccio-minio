import { Logger, Package, IReadTarball, IUploadTarball, ILocalPackageManager } from '@verdaccio/types';
import { getConflict } from '@verdaccio/commons-api';
import { wrap, isNotFound } from './errors';

import TarballStream from './tarball';
import Client from './client';

const PKG_FILE_NAME = 'package.json';
const ERROR_EXIST = 'EEXISTS';

export default class Storage implements ILocalPackageManager {
  public logger: Logger;
  private client: Client;
  private name: string;

  public constructor(client: Client, logger: Logger, name: string) {
    this.client = client;
    this.logger = logger;
    this.name = name;
  }

  writeTarball(name: string): IUploadTarball {
    const key = `${this.name}/${name}`;
    const tbs = new TarballStream(this.logger, `UploadTarball<${key}>`, {});
    this.client.put(key, tbs).catch(error => tbs.emit('error', error));

    return tbs;
  }

  readTarball(name: string): IReadTarball {
    const key = `${this.name}/${name}`;
    const tbs = new TarballStream(this.logger, `ReadTarball<${key}>`, {});
    this.client
      .getStream(key)
      .then(stream => stream.pipe(tbs))
      .catch(error => tbs.emit('error', error));

    return tbs;
  }

  async readPackage(name: string, cb: Function): Promise<void> {
    const key = `${name}/${PKG_FILE_NAME}`;
    try {
      this.debug({ key }, '[Minio] Reading package @{name} at @{key}');
      const data = await this.client.get(key);
      cb(null, JSON.parse(data));
      this.debug({ key }, '[Minio] Successfully loaded package @{name} at @{key}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ key, error }, '[Minio] Failed to load package @{name} at @{key}, @{error}');
    }
  }

  async createPackage(name: string, value: Package, cb: Function): Promise<void> {
    const key = `${this.name}/${PKG_FILE_NAME}`;

    try {
      this.debug({ key }, '[Minio] Creating package @{name} at @{key}');
      const data = await this.client.get(key);
      cb(getConflict(ERROR_EXIST));
      this.debug({ data }, '[Minio] Cannot create package @{name} because it already exist');
    } catch (error) {
      if (isNotFound(error)) {
        await this.savePackage(name, value, cb);
      } else {
        this.debug({ key, error }, '[Minio] Creating package @{name} with @{key} failed: @{error}');
        throw wrap(error);
      }
    }
  }

  async savePackage(name: string, json: Package, cb: Function): Promise<void> {
    const key = `${name}/${PKG_FILE_NAME}`;
    const data = JSON.stringify(json, null, '  ');

    try {
      this.debug({ key }, '[Minio] Saving package @{name} at @{key}');
      const result = await this.client.put(key, data);
      cb(null);
      this.debug({ key, result }, '[Minio] Saved package @{name} at @{key}, @{result}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ key, error }, '[Minio] Failed to save package @{name} at @{key}, @{error}');
    }
  }

  async deletePackage(name: string, cb: Function): Promise<void> {
    const key = `${this.name}/${name}`;
    try {
      this.debug({ key }, '[Minio] Deleting package @{name} at @{key}');
      await this.client.remove(key);
      cb(null);
      this.debug({ key }, '[Minio] Deleted package @{name} at @{key}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ key, error }, '[Minio] Failed to delete package @{name} at@{key}, @{error}');
    }
  }

  async removePackage(cb: Function): Promise<void> {
    try {
      this.debug({}, '[Minio] Removing package @{name}');
      await this.client.remove(this.name);
      cb(null);
      this.debug({}, '[Minio] Removed package @{name}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ error }, '[Minio] Failed to remove package @{name}, @{error}');
    }
  }

  async updatePackage(
    name: string,
    update: Function,
    write: Function,
    transform: Function,
    cb: Function
  ): Promise<void> {
    const key = `${this.name}/${PKG_FILE_NAME}`;

    try {
      const data = await this.client.get(key);
      const pkg = JSON.parse(data);
      update(pkg, error => {
        if (error) {
          this.debug({ key, error }, '[Minio] Failed to apply update on package @{name} at @{key}, @{error}');
          return cb(wrap(error));
        }

        this.debug({ key }, '[Minio] Transforming package @{name} at @{key}');
        const next = transform(pkg);
        this.debug({ key, error }, '[Minio] Transform applied to package @{name} at @{key}, @{next}');
        write(name, next, cb);
      });
    } catch (error) {
      this.debug({ key, error }, '[Minio] Failed to update package @{name} at @{key}, @{error}');
      return cb(wrap(error));
    }
  }

  private debug(conf: any, template: string): void {
    this.logger.debug({ name: this.name, ...conf }, template);
  }
}
