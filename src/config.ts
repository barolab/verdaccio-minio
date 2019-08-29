import { Config as VerdaccioConfig } from '@verdaccio/types';

export interface ClientConfig {
  endPoint: string;
  accessKey: string;
  secretKey: string;
  port?: number;
  bucket?: string;
  region?: string;
  useSSL?: boolean;
  delay?: number;
  retries?: number;
}

export interface PluginConfig extends ClientConfig, VerdaccioConfig {}
