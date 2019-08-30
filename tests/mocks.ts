import { Logger } from '@verdaccio/types';
import { Readable } from 'stream';
import { ClientConfig } from '../src/config';
import { MINIO } from '../src/errors';

class ErrorWithCode extends Error {
  public code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const NotFound = new ErrorWithCode(MINIO.NOT_FOUND, 'Object not found');
export const Unknown = new ErrorWithCode('Unknown', 'Unknown error');

export const stream = (str: string): Readable => {
  const b = Buffer.from(str);
  const readable = new Readable();
  readable._read = (): void => {};
  readable.push(b);
  readable.push(null);

  return readable;
};

export const stat = {
  size: 100,
  etag: 'object etag',
  lastModified: new Date(),
  metaData: {},
};

export const config: ClientConfig = {
  endPoint: 'minio',
  accessKey: 'this-is-not-so-secret',
  secretKey: 'this-is-not-so-secret',
  bucket: 'buck-test',
  region: 'north-pole',
};

export const logger = {
  child: (): Logger => logger,
  debug: (): void => {},
  trace: (): void => {},
  error: (): void => {},
  http: (): void => {},
  warn: (): void => {},
  info: (): void => {},
};
