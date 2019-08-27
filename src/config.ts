import { Config } from '@verdaccio/types';

export interface MinioConfig extends Config {
  endPoint: string;
  accessKey: string;
  secretKey: string;
  port?: number;
  bucket?: string;
  region?: string;
  useSSL?: boolean;
}
