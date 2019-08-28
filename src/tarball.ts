import { Logger, IUploadTarball, IReadTarball } from '@verdaccio/types';
import { PassThrough } from 'stream';

export default class TarballStream extends PassThrough implements IUploadTarball, IReadTarball {
  private logger: Logger;
  private name: string;

  constructor(logger: Logger, name: string, options: any) {
    super(options);
    this.logger = logger;
    this.name = name;

    this.on('end', () => this.debug({}, '[Minio] Stream @{name} is ending'));
    this.on('close', () => this.debug({}, '[Minio] Stream @{name} is closing'));
    this.on('error', error => this.debug({ error }, '[Minio] Stream @{name} error: @{error}'));
    this.on('finish', () => this.debug({}, '[Minio] Stream @{name} is finishing'));
  }

  abort(): void {
    this.debug({}, '[Minio] Stream @{name} is being aborted');
    this.emit('close');
  }

  done(): void {
    this.debug({}, '[Minio] Stream @{name} is being finished');
    this.emit('success');
  }

  private debug(conf: any, template: string): void {
    this.logger.debug({ name: this.name, ...conf }, template);
  }
}
