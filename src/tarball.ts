import { UploadTarball, ReadTarball } from '@verdaccio/streams';
import { Logger } from '@verdaccio/types';
import { Stream } from 'stream';

const debug = (stream: Stream, logger: Logger, name: string) => {
  stream.on('end', () => logger.debug({ name }, '[Minio] @{name} is ending'));
  stream.on('open', () => logger.debug({ name }, '[Minio] @{name} is opened'));
  stream.on('close', () => logger.debug({ name }, '[Minio] @{name} is closing'));
  stream.on('error', error => logger.debug({ name, error }, '[Minio] @{name} error: @{error}'));
  stream.on('finish', () => logger.debug({ name }, '[Minio] @{name} is finishing'));
  stream.on('data', chunk => logger.debug({ name, size: chunk.length }, '[Minio] @{name} received @{size} bytes'));
};

export class WriteStream extends UploadTarball {
  private logger: Logger;
  private name: string;

  constructor(logger: Logger, name: string, options: any) {
    super(options);
    debug(this, logger, `WriteStream<${name}>`);

    this.logger = logger;
    this.name = name;
  }

  abort(): void {
    this.logger.debug({ name: this.name }, '[Minio] WriteStream<@{name}> is being aborted');
    this.emit('close');
  }

  done(): void {
    this.logger.debug({ name: this.name }, '[Minio] WriteStream<@{name}> is being finished');
    this.emit('success');
  }
}

export class ReadStream extends ReadTarball {
  private logger: Logger;
  private name: string;

  constructor(logger: Logger, name: string, options: any) {
    super(options);
    debug(this, logger, `ReadStream<${name}>`);

    this.logger = logger;
    this.name = name;
  }

  abort(): void {
    this.logger.debug({ name: this.name }, '[Minio] ReadStream<@{name}> is being aborted');
    this.emit('close');
  }
}
