export type RetryFunction = <T>(f: () => Promise<T>) => Promise<T>;

/**
 * Interface for configuring the retry wrapper
 */
export interface RetryConfig {
  delay: number; // In milliseconds
  retries: number | 'INFINITELY';
  log: (msg: string) => void;
}

/**
 * Default configuration for the retry wrapper
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  delay: 100,
  retries: 10,
  log: () => undefined,
};

/**
 * Check if the given parameter represent an infinite value
 *
 * @param num
 */
const isInfinite = (num: number | string): boolean => num === 'INFINITELY' || num < 0;

/**
 * Helper function to wait for the given amount of time
 *
 * @param ms
 */
export async function wait(ms: number): Promise<void> {
  if (ms === 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve): number => setTimeout(resolve, ms));
}

/**
 * Implement a retry mechanism around a promised function. The function is executed the given amount of time
 * with delay between each execution. Once the promise succeed the retry function stop, returning the result
 * of the promise. This implementation does not use timeout or curving delay, for the sake of simplicity.
 *
 * @param f
 * @param cfg
 */
const retry = (cfg?: Partial<RetryConfig>): RetryFunction => {
  const config = Object.assign({}, DEFAULT_RETRY_CONFIG, cfg);
  const retries = isInfinite(config.retries) ? Number.MAX_SAFE_INTEGER : config.retries;

  return async <T>(f: () => Promise<T>): Promise<T> => {
    if (retries === 0) {
      return f();
    }

    let error: Error | null = null;
    for (let i = 0; i <= retries; i++) {
      try {
        return await f();
      } catch (err) {
        config.log(`Retry ${i} failed: ${err.message}`);
        error = err;
      }

      // don't wait for last execution
      if (i < retries) {
        await wait(config.delay);
      }
    }

    throw error;
  };
};

export default retry;
