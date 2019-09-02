import { Logger, Config, Package } from '@verdaccio/types';
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

export const logger = {
  child: (): Logger => logger,
  debug: jest.fn(),
  trace: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

export const pkg: Package = {
  name: 'test',
  versions: {},
  'dist-tags': {},
  _distfiles: {},
  _attachments: {},
  _uplinks: {},
  _rev: '',
};

export const token = {
  user: 'user-c',
  key: 'token-a',
  token: 'ca',
  readonly: true,
  created: new Date().getTime(),
};

export const config: ClientConfig = {
  endPoint: 'minio',
  accessKey: 'this-is-not-so-secret',
  secretKey: 'this-is-not-so-secret',
  bucket: 'buck-test',
  region: 'north-pole',
};

export const pcfg: Config = {
  getMatchedPackagesSpec: () => {},
  checkSecretKey: () => '',
  user_agent: '',
  server_id: '',
  secret: '',
  self_path: '',
  packages: {},
  uplinks: {},
  security: {
    web: { sign: {}, verify: {} },
    api: { legacy: false },
  },
};
