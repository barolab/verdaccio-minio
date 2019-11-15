import { getConflict } from '@verdaccio/commons-api';
import { pkg, stat, stream, logger, NotFound, Unknown } from '../tests/mocks';
import { wrap, NOT_FOUND, INTERNAL } from './errors';
import Storage from './storage';
import Client from './client';

jest.mock('./client');

// eslint-disable-next-line
const MockedClient = <jest.Mock<Client>>Client;
let client: jest.Mocked<Client>;

describe('storage', () => {
  beforeEach(() => {
    MockedClient.mockClear();
    new MockedClient();
    client = MockedClient.mock.instances[0] as jest.Mocked<Client>;
  });

  describe('package', () => {
    describe('read', () => {
      it('can read a package', async () => {
        expect.assertions(2);
        client.get.mockResolvedValue(JSON.stringify(pkg));

        const st = new Storage(client, logger, 'test');
        await st.readPackage('test', (err, res) => {
          expect(err).toBeNull();
          expect(res).toEqual(pkg);
        });
      });

      it('throws an error when getting a package fails', async () => {
        expect.assertions(2);
        client.get.mockRejectedValue(NotFound);

        const st = new Storage(client, logger, 'test');
        await st.readPackage('test', (err, res) => {
          expect(err).toEqual(NOT_FOUND);
          expect(res).toBeUndefined();
        });
      });
    });

    describe('create', () => {
      it('throws a conflict if package already exist', async () => {
        expect.assertions(1);
        client.get.mockResolvedValue(JSON.stringify(pkg));

        const st = new Storage(client, logger, 'test');
        await st.createPackage('test', pkg, err => {
          expect(err).toEqual(getConflict('EEXISTS'));
        });
      });

      it('save the package if it does not exist yet', async () => {
        expect.assertions(1);
        client.get.mockRejectedValue(NotFound);
        client.put.mockResolvedValue('etag');

        const st = new Storage(client, logger, 'test');
        await st.createPackage('test', pkg, err => {
          expect(err).toBeNull();
        });
      });

      it('throws an error if a failure happened during the loading of the package', async () => {
        expect.assertions(2);
        client.get.mockRejectedValue(Unknown);
        client.put.mockRejectedValue(Unknown);

        const st = new Storage(client, logger, 'test');
        await st.createPackage('test', pkg, err => {
          expect(err).toEqual(INTERNAL);
          expect(client.put).not.toHaveBeenCalled();
        });
      });

      it('throws an error if a failure happened during the saving of the package', async () => {
        expect.assertions(1);
        client.get.mockRejectedValue(NotFound);
        client.put.mockRejectedValue(Unknown);

        const st = new Storage(client, logger, 'test');
        await st.createPackage('test', pkg, err => {
          expect(err).toEqual(INTERNAL);
        });
      });
    });

    describe('delete', () => {
      it('can delete a package', async () => {
        expect.assertions(1);
        client.remove.mockResolvedValue();

        const st = new Storage(client, logger, 'test');
        await st.deletePackage('test', err => {
          expect(err).toBeNull();
        });
      });

      it('throws an error when deleting a package fails', async () => {
        expect.assertions(1);
        client.remove.mockRejectedValue(NotFound);

        const st = new Storage(client, logger, 'test');
        await st.deletePackage('test', err => {
          expect(err).toEqual(NOT_FOUND);
        });
      });
    });

    describe('remove', () => {
      it('can remove a package', async () => {
        expect.assertions(1);
        client.remove.mockResolvedValue();

        const st = new Storage(client, logger, 'test');
        await st.removePackage(err => {
          expect(err).toBeNull();
        });
      });

      it('throws an error when removing a package fails', async () => {
        expect.assertions(1);
        client.remove.mockRejectedValue(NotFound);

        const st = new Storage(client, logger, 'test');
        await st.removePackage(err => {
          expect(err).toEqual(NOT_FOUND);
        });
      });
    });

    describe('update', () => {
      it('can update a package', async () => {
        expect.assertions(4);
        client.get.mockResolvedValue(JSON.stringify(pkg));
        const transformed = { ...pkg, name: 'transformed-test' };
        const transform = jest.fn();
        const update = jest.fn();
        const write = jest.fn();

        transform.mockImplementation(() => transformed);
        update.mockImplementation((p, cb) => cb(null, p));
        write.mockImplementation((name, state, cb) => cb(null, name, state));

        const st = new Storage(client, logger, 'test');
        await st.updatePackage('test', update, write, transform, err => {
          expect(err).toBeNull();
          expect(transform).toHaveBeenCalled();
          expect(update).toHaveBeenCalled();
          expect(write).toHaveBeenCalled();
        });
      });
      it('fails when updating failed', async () => {
        expect.assertions(4);
        client.get.mockResolvedValue(JSON.stringify(pkg));
        const transformed = { ...pkg, name: 'transformed-test' };
        const transform = jest.fn();
        const update = jest.fn();
        const write = jest.fn();

        transform.mockImplementation(() => transformed);
        update.mockImplementation((p, cb) => cb(Unknown, p));
        write.mockImplementation((name, state, cb) => cb(null, name, state));

        const st = new Storage(client, logger, 'test');
        await st.updatePackage('test', update, write, transform, err => {
          expect(err.message).toEqual(INTERNAL.message);
          expect(transform).not.toHaveBeenCalled();
          expect(update).toHaveBeenCalled();
          expect(write).not.toHaveBeenCalled();
        });
      });

      it('fails when package is not found', async () => {
        expect.assertions(4);
        client.get.mockRejectedValue(NotFound);
        const transformed = { ...pkg, name: 'transformed-test' };
        const transform = jest.fn();
        const update = jest.fn();
        const write = jest.fn();

        transform.mockImplementation(() => transformed);
        update.mockImplementation((p, cb) => cb(null, p));
        write.mockImplementation((name, state, cb) => cb(null, name, state));

        const st = new Storage(client, logger, 'test');
        await st.updatePackage('test', update, write, transform, err => {
          expect(err.message).toEqual(NOT_FOUND.message);
          expect(transform).not.toHaveBeenCalled();
          expect(update).not.toHaveBeenCalled();
          expect(write).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('tarballs', () => {
    it('should write tarball to storage using streams', done => {
      expect.assertions(1);
      client.exist.mockResolvedValue(false);
      client.put.mockResolvedValue('etag');

      const st = new Storage(client, logger, 'test');
      const tbs = st.writeTarball('test.tar.gz');

      tbs.on('success', () => {
        done();
      });

      tbs.on('open', () => {
        expect(client.exist).toHaveBeenCalledWith('test/test.tar.gz');
      });

      tbs.on('error', error => {
        done.fail(`Unexpected error has been emitted in write stream: ${error}`);
      });
    });

    it('should emit an error when package exists', done => {
      expect.assertions(1);
      client.exist.mockResolvedValue(true);

      const st = new Storage(client, logger, 'test');
      const tbs = st.writeTarball('test.tar.gz');

      tbs.on('success', () => {
        done.fail('Received success while an error is expected');
      });

      tbs.on('error', error => {
        expect(error).toEqual(getConflict());
        done();
      });
    });

    it('should emit an error when uploading fails', done => {
      expect.assertions(2);
      client.exist.mockResolvedValue(false);
      client.put.mockRejectedValue(Unknown);

      const st = new Storage(client, logger, 'test');
      const tbs = st.writeTarball('test.tar.gz');

      tbs.on('success', () => {
        done.fail('Received success while an error is expected');
      });

      tbs.on('open', () => {
        expect(client.exist).toHaveBeenCalledWith('test/test.tar.gz');
      });

      tbs.on('error', error => {
        expect(error).toEqual(wrap(Unknown));
        done();
      });
    });

    it('should be able to read package in a stream', done => {
      expect.assertions(3);
      const s = stream('test');
      client.getStream.mockResolvedValue(s);
      client.stat.mockResolvedValue(stat);

      const st = new Storage(client, logger, 'test');
      const tbs = st.readTarball('test.tar.gz');

      tbs.on('content-length', size => {
        expect(size).toEqual(stat.size);
      });

      tbs.on('open', () => {
        expect(client.getStream).toHaveBeenCalledWith('test/test.tar.gz');
        expect(client.stat).toHaveBeenCalledWith('test/test.tar.gz');
        done();
      });

      tbs.on('error', error => {
        done.fail(`Unexpected error has been emitted in write stream: ${error}`);
      });
    });

    it('should emit all the errors that happens with the storage stream', done => {
      expect.assertions(4);
      const s = stream('test');
      client.getStream.mockResolvedValue(s);
      client.stat.mockResolvedValue(stat);

      const st = new Storage(client, logger, 'test');
      const tbs = st.readTarball('test.tar.gz');

      tbs.on('content-length', size => {
        expect(size).toEqual(stat.size);
      });

      tbs.on('open', () => {
        expect(client.getStream).toHaveBeenCalledWith('test/test.tar.gz');
        expect(client.stat).toHaveBeenCalledWith('test/test.tar.gz');
        s.emit('error', Unknown);
      });

      tbs.on('error', error => {
        expect(error).toEqual(INTERNAL);
        done();
      });
    });

    it('should emit error when storage return a failure', done => {
      expect.assertions(1);
      const s = stream('test');
      client.getStream.mockResolvedValue(s);
      client.stat.mockRejectedValue(Unknown);

      const st = new Storage(client, logger, 'test');
      const tbs = st.readTarball('test.tar.gz');

      tbs.on('error', error => {
        expect(error).toEqual(INTERNAL);
        done();
      });
    });
  });
});
