import { stat, logger, token, config, pcfg, Unknown } from '../tests/mocks';
import { wait } from './async';
import Storage from './storage';
import Plugin from './index';

const cfg = { ...pcfg, ...config, store: { minio: config } };
const options = { config: cfg, logger };

// eslint-disable-next-line
const MockedStorage = <jest.Mock<Storage>>Storage;
const MockedClient = { stat: jest.fn(), initialize: jest.fn() };
const MockedDatabase = {
  get: jest.fn(),
  add: jest.fn(),
  search: jest.fn(),
  remove: jest.fn(),
  getSecret: jest.fn(),
  setSecret: jest.fn(),
};

const MockedTokens = {
  get: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
};

jest.mock('./db', () => jest.fn().mockImplementation(() => MockedDatabase));
jest.mock('./client', () => jest.fn().mockImplementation(() => MockedClient));
jest.mock('./tokens', () => jest.fn().mockImplementation(() => MockedTokens));
jest.mock('./storage');

describe('plugin', () => {
  beforeEach(() => {
    MockedStorage.mockClear();
    MockedClient.stat.mockClear();
    MockedClient.initialize.mockClear();
    MockedTokens.get.mockClear();
    MockedTokens.add.mockClear();
    MockedTokens.remove.mockClear();
    MockedDatabase.get.mockClear();
    MockedDatabase.add.mockClear();
    MockedDatabase.search.mockClear();
    MockedDatabase.remove.mockClear();
    MockedDatabase.getSecret.mockClear();
    MockedDatabase.setSecret.mockClear();
  });

  describe('initialization', () => {
    it('should not log anything when client initialization succeed', async () => {
      expect.assertions(1);
      MockedClient.initialize.mockResolvedValue('');
      new Plugin(cfg, options);
      await wait(10);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log an error when client initialization fails', async () => {
      expect.assertions(1);
      MockedClient.initialize.mockRejectedValue(Unknown);
      new Plugin(cfg, options);
      await wait(10);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('packages', () => {
    it('can search for multiple packages', async () => {
      MockedDatabase.search.mockResolvedValue(['test-a', 'test-b', 'test-c']);
      MockedClient.stat
        .mockResolvedValueOnce({ ...stat, etag: 'a' })
        .mockResolvedValueOnce({ ...stat, etag: 'b' })
        .mockResolvedValueOnce({ ...stat, etag: 'c' });

      const validate = jest.fn();
      const onPackage = jest.fn();
      const onEnd = jest.fn();

      const plugin = new Plugin(cfg, options);
      plugin.search(onPackage, onEnd, validate);
      await wait(10);
      expect(MockedDatabase.search).toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalledWith(null);
      expect(onPackage).toHaveBeenCalledTimes(3);
      expect(onPackage).toHaveBeenNthCalledWith(1, { ...stat, etag: 'a' });
      expect(onPackage).toHaveBeenNthCalledWith(2, { ...stat, etag: 'b' });
      expect(onPackage).toHaveBeenNthCalledWith(3, { ...stat, etag: 'c' });
    });

    it('should delegate get to database', () => {
      const packages = ['test-a', 'test-b'];
      MockedDatabase.get.mockResolvedValue(packages);

      const plugin = new Plugin(cfg, options);
      plugin.get((err, p) => {
        expect(p).toEqual(packages);
        expect(err).toBeNull();
        expect(MockedDatabase.get).toHaveBeenCalled();
      });
    });

    it('should wrap db.get error', () => {
      MockedDatabase.get.mockRejectedValue(Unknown);

      const plugin = new Plugin(cfg, options);
      plugin.get((err, p) => {
        expect(p).toEqual([]);
        expect(err).toEqual(Unknown);
        expect(MockedDatabase.get).toHaveBeenCalled();
      });
    });

    it('should delegate add to database', () => {
      MockedDatabase.add.mockResolvedValue(null);

      const plugin = new Plugin(cfg, options);
      plugin.add('test', (err) => {
        expect(err).toBeNull();
        expect(MockedDatabase.add).toHaveBeenCalled();
      });
    });

    it('should wrap db.add error', () => {
      MockedDatabase.add.mockRejectedValue(Unknown);

      const plugin = new Plugin(cfg, options);
      plugin.add('test', (err) => {
        expect(err).toEqual(Unknown);
        expect(MockedDatabase.add).toHaveBeenCalled();
      });
    });

    it('should delegate remove to database', () => {
      MockedDatabase.remove.mockResolvedValue(null);

      const plugin = new Plugin(cfg, options);
      plugin.remove('test', (err) => {
        expect(err).toBeNull();
        expect(MockedDatabase.remove).toHaveBeenCalled();
      });
    });

    it('should wrap db.remove error', () => {
      MockedDatabase.remove.mockRejectedValue(Unknown);

      const plugin = new Plugin(cfg, options);
      plugin.remove('test', (err) => {
        expect(err).toEqual(Unknown);
        expect(MockedDatabase.remove).toHaveBeenCalled();
      });
    });
  });

  describe('secret', () => {
    it('should delegate get secret to database', async () => {
      expect.assertions(2);
      MockedDatabase.getSecret.mockResolvedValue('secret');
      const plugin = new Plugin(cfg, options);
      const result = await plugin.getSecret();
      expect(result).toEqual('secret');
      expect(MockedDatabase.getSecret).toHaveBeenCalled();
    });

    it('should delegate set secret to database', async () => {
      expect.assertions(2);
      MockedDatabase.setSecret.mockResolvedValue('secret');
      const plugin = new Plugin(cfg, options);
      const result = await plugin.setSecret('this-is-not-so-secret');
      expect(result).toEqual('secret');
      expect(MockedDatabase.setSecret).toHaveBeenCalled();
    });
  });

  describe('token', () => {
    it('should delegate read to tokens', async () => {
      expect.assertions(2);
      MockedTokens.get.mockResolvedValue([]);
      const plugin = new Plugin(cfg, options);
      const result = await plugin.readTokens({ user: 'user-a' });
      expect(result).toEqual([]);
      expect(MockedTokens.get).toHaveBeenCalled();
    });

    it('should delegate save to tokens', async () => {
      expect.assertions(2);
      MockedTokens.add.mockResolvedValue(null);
      const plugin = new Plugin(cfg, options);
      const result = await plugin.saveToken(token);
      expect(result).toBeNull();
      expect(MockedTokens.add).toHaveBeenCalled();
    });

    it('should delegate delete to tokens', async () => {
      expect.assertions(2);
      MockedTokens.remove.mockResolvedValue(null);
      const plugin = new Plugin(cfg, options);
      const result = await plugin.deleteToken('user-a', 'token-a');
      expect(result).toBeNull();
      expect(MockedTokens.remove).toHaveBeenCalled();
    });
  });

  describe('storage', () => {
    it('creates a new Storage instance for each invocation', () => {
      const plugin = new Plugin(cfg, options);
      plugin.getPackageStorage('test-a');
      expect(MockedStorage.mock.instances).toHaveLength(1);
      plugin.getPackageStorage('test-b');
      expect(MockedStorage.mock.instances).toHaveLength(2);
      plugin.getPackageStorage('test-c');
      expect(MockedStorage.mock.instances).toHaveLength(3);
    });
  });
});
