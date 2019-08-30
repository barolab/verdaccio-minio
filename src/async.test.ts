import retry from './async';

describe('async', () => {
  describe('retry', () => {
    it('should return result when function succeed', async () => {
      expect.assertions(1);

      const r = retry({ retries: 0 });
      const f = jest.fn().mockResolvedValue('Success');
      const result = await r(f);

      expect(result).toEqual('Success');
    });

    it('should try infinitely until success when retries is set to a negative number', async () => {
      expect.assertions(1);

      const e = new Error('Something bad happened');
      const r = retry({ retries: -1, delay: 0 });
      const f = jest
        .fn()
        .mockRejectedValue(e)
        .mockRejectedValue(e)
        .mockRejectedValue(e)
        .mockRejectedValue(e)
        .mockResolvedValue('Success');

      const result = await r(f);

      expect(result).toEqual('Success');
    });

    it('should return an error when function fails all the times', async () => {
      expect.assertions(1);

      const e = new Error('Something bad happened');
      const r = retry({ delay: 0 });
      const f = jest.fn().mockRejectedValue(e);

      try {
        await r(f);
      } catch (error) {
        expect(error).toEqual(e);
      }
    });

    it('should wait between function calls when error occurs', async () => {
      expect.assertions(1);
      const e = new Error('Something bad happened');
      const r = retry({ retries: 3, delay: 10 });
      const f = jest.fn().mockRejectedValue(e);

      try {
        await r(f);
      } catch (error) {
        expect(error).toEqual(e);
      }
    });
  });
});
