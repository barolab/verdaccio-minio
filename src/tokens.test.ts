import { logger, NotFound, Unknown } from '../tests/mocks';
import Tokens from './tokens';
import Client from './client';

jest.mock('./client');

const tokens = {
  'user-a:token-a': 'aa',
  'user-a:token-b': 'ab',
  'user-b:token-a': 'ba',
  'user-b:token-b': 'bb',
};

// eslint-disable-next-line
const MockedClient = <jest.Mock<Client>>Client;
let client: jest.Mocked<Client>;

describe('tokens', () => {
  beforeEach(() => {
    MockedClient.mockClear();
    new MockedClient();
    client = MockedClient.mock.instances[0] as jest.Mocked<Client>;
  });

  describe('get', () => {
    it('can get all the tokens', async () => {
      expect.assertions(1);
      client.get.mockResolvedValue(JSON.stringify({ tokens }));

      const tk = new Tokens(client, logger);
      const result = await tk.get({ user: 'user-a' });

      expect(result).toEqual(['aa', 'ab']);
    });

    it('throws an error when getting tokens failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(Unknown);

      const tk = new Tokens(client, logger);

      try {
        await tk.get({ user: 'user-a' });
      } catch (error) {
        expect(error.message).toEqual(`Failed to load tokens from remote storage, ${Unknown}`);
      }
    });
  });

  describe('add', () => {
    it('add a token to the list', async () => {
      expect.assertions(2);
      client.get.mockRejectedValue(NotFound);
      client.put.mockResolvedValue('etag');

      const tk = new Tokens(client, logger);
      const token = {
        user: 'user-c',
        key: 'token-a',
        token: 'ca',
        readonly: true,
        created: new Date().getTime(),
      };

      await tk.add(token);
      const result = await tk.get({ user: 'user-c' });

      expect(client.put).toHaveBeenCalled();
      expect(result).toEqual([token]);
    });

    it('throws an error when loading tokens failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(Unknown);

      const tk = new Tokens(client, logger);
      const token = {
        user: 'user-c',
        key: 'token-a',
        token: 'ca',
        readonly: true,
        created: new Date().getTime(),
      };

      try {
        await tk.add(token);
      } catch (error) {
        expect(error.message).toEqual(`Failed to load tokens from remote storage, ${Unknown}`);
      }
    });

    it('throws an error when saving tokens failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(NotFound);
      client.put.mockRejectedValue(Unknown);

      const tk = new Tokens(client, logger);
      const token = {
        user: 'user-c',
        key: 'token-a',
        token: 'ca',
        readonly: true,
        created: new Date().getTime(),
      };

      try {
        await tk.add(token);
      } catch (error) {
        expect(error.message).toEqual(`Failed to save tokens from remote storage, ${Unknown}`);
      }
    });
  });

  describe('remove', () => {
    it('remove a token to the list', async () => {
      expect.assertions(2);
      client.get.mockResolvedValue(JSON.stringify({ tokens }));
      client.put.mockResolvedValue('etag');

      const tk = new Tokens(client, logger);
      await tk.remove('user-a', 'token-a');
      const result = await tk.get({ user: 'user-a' });

      expect(client.put).toHaveBeenCalled();
      expect(result).toEqual(['ab']);
    });

    it('throws an error when loading tokens failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(Unknown);

      const tk = new Tokens(client, logger);

      try {
        await tk.remove('user-a', 'token-a');
      } catch (error) {
        expect(error.message).toEqual(`Failed to load tokens from remote storage, ${Unknown}`);
      }
    });

    it('throws an error when saving tokens failed', async () => {
      expect.assertions(1);
      client.get.mockRejectedValue(NotFound);
      client.put.mockRejectedValue(Unknown);

      const tk = new Tokens(client, logger);

      try {
        await tk.remove('user-a', 'token-a');
      } catch (error) {
        expect(error.message).toEqual(`Failed to save tokens from remote storage, ${Unknown}`);
      }
    });
  });
});
