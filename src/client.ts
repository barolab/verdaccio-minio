import str, { buffer } from 'get-stream';
import { Stream } from 'stream';
import { Logger } from '@verdaccio/types';
import { Client as MinioClient } from 'minio';
import { ClientConfig } from './config';
import { PackageStat } from './stat';

const DEFAULT_BUCKET = 'verdaccio';
const DEFAULT_REGION = 'us-east-1';

/**
 * Wrapper around the default Minio Client, mostly to provide high-level methods with
 * lots of debug messages and some decorated errors.
 *
 * This implementation is fixed on a bucket, so you can't operate in multiple buckets
 * at a time.
 */
export default class Client {
  private logger: Logger;
  private client: MinioClient;
  private bucket: string;
  private region: string;

  public constructor(config: ClientConfig, logger: Logger) {
    if (!config.endPoint) {
      throw new Error('Minio storage requires an endpoint');
    }

    if (!config.accessKey) {
      throw new Error('Minio storage requires an access key');
    }

    if (!config.secretKey) {
      throw new Error('Minio storage requires a secret key');
    }

    this.bucket = config.bucket ? config.bucket : DEFAULT_BUCKET;
    this.region = config.region ? config.region : DEFAULT_REGION;
    this.logger = logger;
    this.client = new MinioClient({
      port: config.port || 443,
      region: this.region,
      endPoint: config.endPoint,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      useSSL: config.useSSL,
    });
  }

  /**
   * Initialize the client by making sure the bucket exist in minio.
   */
  public async initialize(): Promise<void> {
    try {
      const exist = await this.client.bucketExists(this.bucket);
      if (!exist) {
        this.debug({}, 'Bucket @{bucket} does not exist, creating it');
        await this.client.makeBucket(this.bucket, this.region);
        this.debug({}, 'Bucket @{bucket} creating successfully');
      } else {
        this.debug({}, 'Bucket @{bucket} already exist, keep going');
      }
    } catch (error) {
      this.debug({ error }, 'Failed to ensure bucket @{bucket} exist, @{error}');
      throw new Error(`Failed to ensure bucket ${this.bucket} exist: ${error}`);
    }
  }

  public async get(name: string): Promise<string> {
    return str(await this.getStream(name));
  }

  public async getStream(name: string): Promise<Stream> {
    return await this.client.getObject(this.bucket, name);
  }

  public async exist(name: string): Promise<boolean> {
    try {
      this.logger.debug({ name }, 'Checking if object @{name} exists');
      const stat = await this.stat(name);
      this.logger.debug({ name, time: stat.time }, 'Object @{name} exist, since @{time}');
      return true;
    } catch (error) {
      this.logger.debug({ name, error }, 'Object @{name} does not exist: @{error}');
      return false;
    }
  }

  public async stat(name: string): Promise<PackageStat> {
    const data = await this.client.statObject(this.bucket, name);
    this.logger.debug({ name, data }, 'Got stat for object @{name}, @{data}');

    return {
      name: name,
      path: name,
      size: data.size,
      etag: data.etag,
      time: data.lastModified.getTime(),
      metaData: data.metaData,
    };
  }

  public async put(name: string, data: Buffer | Stream | string): Promise<string> {
    return await this.client.putObject(this.bucket, name, data);
  }

  public async remove(name: string): Promise<void> {
    return await this.client.removeObject(this.bucket, name);
  }

  private debug(conf: any, template: string): void {
    this.logger.debug(
      {
        bucket: this.bucket,
        region: this.region,
        ...conf,
      },
      `[Minio] ${template}`
    );
  }
}
