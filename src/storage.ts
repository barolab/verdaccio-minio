import { Logger, Package, IReadTarball, IUploadTarball, ILocalPackageManager } from '@verdaccio/types';
import { getConflict } from '@verdaccio/commons-api';

import { ReadStream, WriteStream } from './tarball';
import { wrap, isNotFound } from './errors';
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

  public writeTarball(name: string): IUploadTarball {
    const key = `${this.name}/${name}`;
    const tbs = new WriteStream(this.logger, key, {});
    this.debug({ key }, 'Writing tarball at @{key}');
    this.client.exist(key).then(exist => {
      if (exist) {
        return tbs.emit('error', getConflict());
      }

      this.uploadTarball(key, tbs);
      tbs.emit('open');
    });

    return tbs;
  }

  public uploadTarball(key: string, stream: WriteStream): void {
    this.client
      .put(key, stream)
      .then(etag => {
        this.debug({ key, etag }, 'Tarball at @{key} as been uploaded successfully');
        stream.emit('success');
      })
      .catch(error => {
        this.debug({ key, error }, 'Received error when writing tarball at @{key}: @{error}');
        stream.emit('error', wrap(error));
      });
  }

  public readTarball(name: string): IReadTarball {
    const key = `${this.name}/${name}`;
    const tbs = new ReadStream(this.logger, key, {});
    this.debug({ key }, 'Reading tarball at @{key}');
    Promise.all([this.client.getStream(key), this.client.stat(key)])
      .then(([stream, stat]) => {
        this.debug({ key }, 'Opening stream for reading tarball at @{key}');
        stream.pipe(tbs);
        stream.on('error', error => tbs.emit('error', wrap(error)));
        tbs.emit('content-length', stat.size);
        tbs.emit('open');
      })
      .catch(error => {
        this.debug({ key, error }, 'Received error when reading tarball at @{key}: @{error}');
        tbs.emit('error', wrap(error));
      });

    return tbs;
  }

  public async readPackage(name: string, cb: Function): Promise<void> {
    const key = `${name}/${PKG_FILE_NAME}`;
    try {
      this.debug({ key }, 'Reading package @{name} at @{key}');
      const data = await this.client.get(key);
      cb(null, JSON.parse(data));
      this.debug({ key }, 'Successfully loaded package @{name} at @{key}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ key, error }, 'Failed to load package @{name} at @{key}, @{error}');
    }
  }

  public async createPackage(name: string, value: Package, cb: Function): Promise<void> {
    const key = `${this.name}/${PKG_FILE_NAME}`;

    try {
      this.debug({ key }, 'Creating package @{name} at @{key}');
      const data = await this.client.get(key);
      cb(getConflict(ERROR_EXIST));
      this.debug({ data }, 'Cannot create package @{name} because it already exist');
    } catch (error) {
      if (isNotFound(error)) {
        await this.savePackage(name, value, cb);
      } else {
        this.debug({ key, error }, 'Creating package @{name} with @{key} failed: @{error}');
        cb(wrap(error));
      }
    }
  }

  public async savePackage(name: string, json: Package, cb: Function): Promise<void> {
    const key = `${name}/${PKG_FILE_NAME}`;
    const data = JSON.stringify(json, null, '  ');

    try {
      this.debug({ key }, 'Saving package @{name} at @{key}');
      const result = await this.client.put(key, data);
      cb(null);
      this.debug({ key, result }, 'Saved package @{name} at @{key}, @{result}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ key, error }, 'Failed to save package @{name} at @{key}, @{error}');
    }
  }

  public async deletePackage(name: string, cb: Function): Promise<void> {
    const key = `${this.name}/${name}`;
    try {
      this.debug({ key }, 'Deleting package @{name} at @{key}');
      await this.client.remove(key);
      cb(null);
      this.debug({ key }, 'Deleted package @{name} at @{key}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ key, error }, 'Failed to delete package @{name} at@{key}, @{error}');
    }
  }

  public async removePackage(cb: Function): Promise<void> {
    try {
      this.debug({}, 'Removing package @{name}');
      await this.client.remove(this.name);
      cb(null);
      this.debug({}, 'Removed package @{name}');
    } catch (error) {
      cb(wrap(error));
      this.debug({ error }, 'Failed to remove package @{name}, @{error}');
    }
  }

  public async updatePackage(
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
          this.debug({ key, error }, 'Failed to apply update on package @{name} at @{key}, @{error}');
          return cb(wrap(error));
        }

        this.debug({ key }, 'Transforming package @{name} at @{key}');
        const next = transform(pkg);
        this.debug({ key, error }, 'Transform applied to package @{name} at @{key}, @{next}');
        write(name, next, cb);
      });
    } catch (error) {
      this.debug({ key, error }, 'Failed to update package @{name} at @{key}, @{error}');
      return cb(wrap(error));
    }
  }

  private debug(conf: object, template: string): void {
    this.logger.debug({ name: this.name, ...conf }, `[Minio] ${template}`);
  }
}
