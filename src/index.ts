import { Logger, Config, PluginOptions } from '@verdaccio/types';
import { MinioConfig } from './config';

export default class MinioDatabase {
  public logger: Logger;
  public config: MinioConfig;

  public constructor(config: Config, options: PluginOptions<MinioConfig>) {
    if (!config) {
      throw new Error('Minio storage is missing config. Add a `store.minio-storage` section to your config file');
    }

    this.logger = options.logger;
    this.config = { ...config.store['minio-storage'] };
  }
}
