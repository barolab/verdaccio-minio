import { Client as MinioClient } from 'minio';
import { stream, logger, config, stat } from '../tests/mocks';
import Client from './client';

jest.mock('minio');

// eslint-disable-next-line
const MockedMinioClient = <jest.Mock<MinioClient>>MinioClient;

describe('client', () => {
  beforeEach(() => {
    MockedMinioClient.mockClear();
  });

  describe('constructor', () => {
    it('should fail when given an empty endpoint', () => {
      try {
        new Client(
          {
            endPoint: '',
            accessKey: '',
            secretKey: '',
          },
          logger
        );
      } catch (error) {
        expect(error.message).toEqual('Minio storage requires an endpoint');
      }
    });

    it('should fail when given an empty access key', () => {
      try {
        new Client(
          {
            endPoint: 'minio',
            accessKey: '',
            secretKey: '',
          },
          logger
        );
      } catch (error) {
        expect(error.message).toEqual('Minio storage requires an access key');
      }
    });

    it('should fail when given an empty secret key', () => {
      try {
        new Client(
          {
            endPoint: 'minio',
            accessKey: 'this-is-not-so-secret',
            secretKey: '',
          },
          logger
        );
      } catch (error) {
        expect(error.message).toEqual('Minio storage requires a secret key');
      }
    });
  });

  describe('initialize', () => {
    it('should create bucket if it does not exist', async () => {
      expect.assertions(5);
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.bucketExists.mockResolvedValue(false);
      mock.makeBucket.mockResolvedValue();

      await c.initialize();
      expect(mock.bucketExists).toHaveBeenCalledTimes(1);
      expect(mock.bucketExists).toHaveBeenLastCalledWith(config.bucket);
      expect(mock.makeBucket).toHaveBeenCalledTimes(1);
      expect(mock.makeBucket).toHaveBeenLastCalledWith(config.bucket, config.region);
    });

    it('should not create bucket if it already exists', async () => {
      expect.assertions(4);
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.bucketExists.mockResolvedValue(true);
      mock.makeBucket.mockResolvedValue();

      await c.initialize();
      expect(mock.bucketExists).toHaveBeenCalledTimes(1);
      expect(mock.bucketExists).toHaveBeenLastCalledWith(config.bucket);
      expect(mock.makeBucket).not.toHaveBeenCalled();
    });

    it('should throw an error if checking for bucket fails', async () => {
      expect.assertions(5);
      const e = new Error('Failed to check if bucket exist');
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.bucketExists.mockRejectedValue(e);

      try {
        await c.initialize();
      } catch (error) {
        expect(error.message).toEqual(`Failed to ensure bucket ${config.bucket} exist: ${e.message}`);
        expect(mock.bucketExists).toHaveBeenCalledTimes(1);
        expect(mock.bucketExists).toHaveBeenLastCalledWith(config.bucket);
        expect(mock.makeBucket).not.toHaveBeenCalled();
      }
    });

    it('should throw an error if creating bucket fails', async () => {
      expect.assertions(6);
      const e = new Error('Failed to make bucket');
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.bucketExists.mockResolvedValue(false);
      mock.makeBucket.mockRejectedValue(e);

      try {
        await c.initialize();
      } catch (error) {
        expect(error.message).toEqual(`Failed to ensure bucket ${config.bucket} exist: ${e.message}`);
        expect(mock.bucketExists).toHaveBeenCalledTimes(1);
        expect(mock.bucketExists).toHaveBeenLastCalledWith(config.bucket);
        expect(mock.makeBucket).toHaveBeenCalledTimes(1);
        expect(mock.makeBucket).toHaveBeenLastCalledWith(config.bucket, config.region);
      }
    });
  });

  describe('get', () => {
    it('should return a stream when called getStream', async () => {
      expect.assertions(2);
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      const data = stream('test');
      mock.getObject.mockResolvedValue(data);

      expect(await c.getStream('key')).toEqual(data);
    });

    it('should return the string value of the stream when using get', async () => {
      expect.assertions(2);
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      const data = stream('test');
      mock.getObject.mockResolvedValue(data);

      expect(await c.get('key')).toEqual('test');
    });
  });

  describe('exist', () => {
    it('should return true when client can access the object stat', async () => {
      expect.assertions(2);
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.statObject.mockResolvedValue(stat);

      expect(await c.exist('key')).toBeTruthy();
    });

    it('should return false when client cannot access the object stat', async () => {
      expect.assertions(2);
      const e = new Error('Object does not exist');
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.statObject.mockRejectedValue(e);

      expect(await c.exist('key')).toBeFalsy();
    });
  });

  describe('put', () => {
    it('should put the given object to the storage', async () => {
      expect.assertions(4);
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.putObject.mockResolvedValue('etag');
      const data = stream('test');
      const result = await c.put('key', data);

      expect(result).toEqual('etag');
      expect(mock.putObject).toHaveBeenCalledTimes(1);
      expect(mock.putObject).toHaveBeenLastCalledWith(config.bucket, 'key', data);
    });
  });

  describe('remove', () => {
    it('should remove the given object from the storage', async () => {
      expect.assertions(3);
      const c = new Client(config, logger);

      expect(MockedMinioClient).toHaveBeenCalledTimes(1);
      const mock = MockedMinioClient.mock.instances[0] as jest.Mocked<MinioClient>;
      mock.removeObject.mockResolvedValue();

      await c.remove('key');

      expect(mock.removeObject).toHaveBeenCalledTimes(1);
      expect(mock.removeObject).toHaveBeenLastCalledWith(config.bucket, 'key');
    });
  });
});
