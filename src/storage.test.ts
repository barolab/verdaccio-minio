import { getConflict } from '@verdaccio/commons-api';
import { logger, NotFound, Unknown } from '../tests/mocks';
import Storage from './storage';
import Client from './client';

jest.mock('./client');

const pkg = {
  name: 'test',
  versions: {},
  _rev: '',
  _distfiles: {},
  _attachments: {},
  _uplinks: {},
  'dist-tags': {},
};

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
          expect(err).toEqual(NotFound);
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
          expect(err).toEqual(Unknown);
          expect(client.put).not.toHaveBeenCalled();
        });
      });

      it('throws an error if a failure happened during the saving of the package', async () => {
        expect.assertions(1);
        client.get.mockRejectedValue(NotFound);
        client.put.mockRejectedValue(Unknown);

        const st = new Storage(client, logger, 'test');
        await st.createPackage('test', pkg, err => {
          expect(err).toEqual(Unknown);
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
          expect(err).toEqual(NotFound);
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
          expect(err).toEqual(NotFound);
        });
      });
    });
  });
});
