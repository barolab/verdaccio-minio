import { Stream } from 'stream';

import { logger, NotFound, Unknown } from '../tests/mocks';

import Database from './db';
import Client from './client';

jest.mock('./client');

const list = ['package-a', 'package-b', 'package-test-a', 'package-test-b'];

// eslint-disable-next-line
const MockedClient = <jest.Mock<Client>>Client;
let client: jest.Mocked<Client>;

describe('db', () => {
  beforeEach(() => {
    MockedClient.mockClear();
    new MockedClient();
    client = MockedClient.mock.instances[0] as jest.Mocked<Client>;
  });

  describe('load/save', () => {
    it('should load database from storage when it exist', async () => {
      expect.assertions(3);
      client.get.mockResolvedValue(JSON.stringify({ secret: 'secret', list: [] }));

      const db = new Database(client, logger);
      const secret = await db.getSecret();

      expect(secret).toEqual('secret');
      expect(client.get).toHaveBeenCalledTimes(1);
      expect(client.get).toHaveBeenLastCalledWith('db.json');
    });

    it('should load an uninitialized database when it does not exist', async () => {
      expect.assertions(3);
      client.get.mockRejectedValue(NotFound);

      const db = new Database(client, logger);
      const secret = await db.getSecret();

      expect(secret).toEqual('');
      expect(client.get).toHaveBeenCalledTimes(1);
      expect(client.get).toHaveBeenLastCalledWith('db.json');
    });

    it('should load an uninitialized database when is empty', async () => {
      expect.assertions(3);
      client.get.mockResolvedValue('');

      const db = new Database(client, logger);
      const secret = await db.getSecret();

      expect(secret).toEqual('');
      expect(client.get).toHaveBeenCalledTimes(1);
      expect(client.get).toHaveBeenLastCalledWith('db.json');
    });

    it('should throw an error when a failure happened during the loading of the database', async () => {
      expect.assertions(3);
      client.get.mockRejectedValue(Unknown);

      try {
        const db = new Database(client, logger);
        await db.getSecret();
      } catch (error) {
        expect(client.get).toHaveBeenCalledTimes(1);
        expect(client.get).toHaveBeenLastCalledWith('db.json');
        expect(error.message).toEqual(
          `Failed to load the secret, Error: Failed to load database from remote storage, ${Unknown}`
        );
      }
    });

    it('should load setted secret', async () => {
      expect.assertions(1);
      let currentDB: string = JSON.stringify({ secret: 'secret', list: [] });
      client.get.mockImplementation(() => {
        return Promise.resolve(currentDB);
      });
      client.put.mockImplementation((name, data: string | Buffer | Stream) => {
        currentDB = data.toString();
        return Promise.resolve(currentDB);
      });

      const db = new Database(client, logger);
      await db.setSecret('mysecret');
      const a = await db.getSecret();
      expect(a).toEqual('mysecret');
    });

    it('should throw an error when saving fails', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(NotFound);
      client.put.mockRejectedValue(Unknown);

      try {
        const db = new Database(client, logger);
        await db.setSecret('secret');
      } catch (error) {
        expect(error.message).toEqual(
          `Failed to save a new secret, Error: Failed to store database to remote storage, ${Unknown}`
        );
      }
    });
  });

  describe('search', () => {
    it('can search for packages based on a given function', async () => {
      expect.assertions(1);
      client.get.mockResolvedValue(JSON.stringify({ secret: 'secret', list }));

      const db = new Database(client, logger);
      const filter = (p: string): boolean => p.indexOf('test') > -1;
      const result = await db.search(filter);

      expect(result).toEqual(['package-test-a', 'package-test-b']);
    });

    it('throws an error when loading packages failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(Unknown);

      const db = new Database(client, logger);
      const filter = (p: string): boolean => p.indexOf('test') > -1;

      try {
        await db.search(filter);
      } catch (error) {
        expect(error.message).toEqual(
          `Failed to search for packages, Error: Failed to load database from remote storage, ${Unknown}`
        );
      }
    });
  });

  describe('get', () => {
    it('can get all the packages', async () => {
      expect.assertions(1);
      client.get.mockResolvedValue(JSON.stringify({ secret: 'secret', list }));

      const db = new Database(client, logger);
      const result = await db.get();

      expect(result).toEqual(list);
    });

    it('throws an error when getting packages failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(Unknown);

      const db = new Database(client, logger);

      try {
        await db.get();
      } catch (error) {
        expect(error.message).toEqual(
          `Failed to load all the packages, Error: Failed to load database from remote storage, ${Unknown}`
        );
      }
    });
  });

  describe('add', () => {
    it('add a package to the list', async () => {
      expect.assertions(2);
      let currentDB: string = JSON.stringify({ secret: 'secret', list });
      client.get.mockImplementation(() => {
        return Promise.resolve(currentDB);
      });
      client.put.mockImplementation((name, data: string | Buffer | Stream) => {
        currentDB = data.toString();
        return Promise.resolve(currentDB);
      });

      const db = new Database(client, logger);
      await db.add('test');
      const result = await db.get();

      expect(client.put).toHaveBeenCalled();
      expect(result).toEqual([...list, 'test']);
    });

    it('does not add a package if it already exist on the list', async () => {
      expect.assertions(2);
      client.get.mockResolvedValue(JSON.stringify({ secret: 'secret', list }));
      client.put.mockResolvedValue('etag');

      const db = new Database(client, logger);
      await db.add('package-a');
      const result = await db.get();

      expect(client.put).not.toHaveBeenCalled();
      expect(result).toEqual(list);
    });

    it('throws an error when loading packages failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(Unknown);

      const db = new Database(client, logger);

      try {
        await db.add('test');
      } catch (error) {
        expect(error.message).toEqual(
          `Failed to add package, Error: Failed to load database from remote storage, ${Unknown}`
        );
      }
    });

    it('throws an error when saving packages failed', async () => {
      expect.assertions(1);
      client.get.mockResolvedValue(JSON.stringify({ secret: 'secret', list }));
      client.get.mockRejectedValue(Unknown);

      const db = new Database(client, logger);

      try {
        await db.add('test');
      } catch (error) {
        expect(error.message).toEqual(
          `Failed to add package, Error: Failed to load database from remote storage, ${Unknown}`
        );
      }
    });
  });

  describe('remove', () => {
    it('remove a package to the list', async () => {
      expect.assertions(2);
      let currentDB: string = JSON.stringify({ secret: 'secret', list: [...list, 'test'] });
      client.get.mockImplementation(() => {
        return Promise.resolve(currentDB);
      });
      client.put.mockImplementation((name, data: string | Buffer | Stream) => {
        currentDB = data.toString();
        return Promise.resolve(currentDB);
      });

      const db = new Database(client, logger);
      await db.remove('test');
      const result = await db.get();

      expect(client.put).toHaveBeenCalled();
      expect(result).toEqual(list);
    });

    it('does not remove a package if it already exist on the list', async () => {
      expect.assertions(2);
      client.get.mockResolvedValue(JSON.stringify({ secret: 'secret', list }));
      client.put.mockResolvedValue('etag');

      const db = new Database(client, logger);
      await db.remove('test');
      const result = await db.get();

      expect(client.put).not.toHaveBeenCalled();
      expect(result).toEqual(list);
    });

    it('throws an error when loading packages failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(Unknown);

      const db = new Database(client, logger);

      try {
        await db.remove('test');
      } catch (error) {
        expect(error.message).toEqual(
          `Failed to remove package, Error: Failed to load database from remote storage, ${Unknown}`
        );
      }
    });

    it('throws an error when saving packages failed', async () => {
      expect.assertions(1);
      client.get.mockResolvedValue(JSON.stringify({ secret: 'secret', list }));
      client.get.mockRejectedValue(Unknown);

      const db = new Database(client, logger);

      try {
        await db.remove('test');
      } catch (error) {
        expect(error.message).toEqual(
          `Failed to remove package, Error: Failed to load database from remote storage, ${Unknown}`
        );
      }
    });
  });
});
