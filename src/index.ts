import { Logger, Config, PluginOptions } from '@verdaccio/types';
import { MinioConfig } from './config';
import { Client } from 'minio';

const DEFAULT_BUCKET = 'verdaccio';
const DEFAULT_REGION = 'us-east-1';

export default class MinioDatabase {
  public logger: Logger;
  public config: MinioConfig;
  private client: Client;
  private bucket: string;
  private region: string;

  public constructor(config: Config, options: PluginOptions<MinioConfig>) {
    if (!config) {
      throw new Error('Minio storage is missing config. Add a `store.minio-storage` section to your config file');
    }

    const opts = config.store['minio-storage'];
    this.logger = options.logger;
    this.bucket = opts.bucket ? opts.bucket : DEFAULT_BUCKET;
    this.region = opts.region ? opts.region : DEFAULT_REGION;
    this.config = this.configure(opts);
    this.client = new Client(this.config);

    this.initialize().catch(error => {
      throw new Error(`There was an error ensuring bucket "${this.bucket}" exist: ${error}`);
    });
  }

  private async initialize(): Promise<void> {
    const exist = await this.client.bucketExists(this.bucket);
    if (!exist) {
      this.debug({}, 'Minio: Bucket @{bucket} does not exist, creating it');
      await this.client.makeBucket(this.bucket, this.region);
      this.debug({}, 'Minio: Bucket @{bucket} creating successfully');
    } else {
      this.debug({}, 'Minio: Bucket @{bucket} already exist, keep going');
    }
  }

  private debug(conf: any, template: string): void {
    this.logger.debug(
      {
        bucket: this.bucket,
        region: this.region,
        ...conf,
      },
      template
    );
  }

  private configure(opts: any): MinioConfig {
    if (!opts.endpoint) {
      throw new Error('Minio storage requires an endpoint');
    }

    if (!opts.accessKey) {
      throw new Error('Minio storage requires an access key');
    }

    if (!opts.secretKey) {
      throw new Error('Minio storage requires a secret key');
    }

    return {
      ...opts,
      endPoint: opts.endPoint,
      accessKey: opts.accessKey,
      secretKey: opts.secretKey,
      bucket: this.bucket,
      region: this.region,
      port: opts.port || 443,
      useSSL: opts.useSSL || true,
    };
  }
}
