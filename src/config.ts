import { Config } from '@verdaccio/types';

export interface MinioConfig extends Config {
  bucket: string;
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region?: string;
}
