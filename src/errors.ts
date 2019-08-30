import { getNotFound, getInternalError, VerdaccioError } from '@verdaccio/commons-api';

interface MinioError extends Error {
  code?: string;
  key?: string;
  resource?: string;
}

export const MINIO = {
  NO_SUCH_KEY: 'NoSuchKey',
  NOT_FOUND: 'NotFound',
};

/**
 * Check if an error as a code property
 *
 * @param err
 */
export const hasCode = (err: Error): boolean => 'code' in err;

/**
 * Check if the given error is a 404
 *
 * @param error
 */
export function isNotFound(error: MinioError): boolean {
  return error.code === MINIO.NOT_FOUND || error.code == MINIO.NO_SUCH_KEY;
}

/**
 * Wrap a minio error to a verdaccio error
 *
 * @param error
 */
export function wrap(error: MinioError): VerdaccioError {
  if (!hasCode(error)) {
    return getInternalError(error.message);
  }

  switch (error.code) {
    case MINIO.NO_SUCH_KEY:
    case MINIO.NOT_FOUND:
      return getNotFound(error.message);
    default:
      return getInternalError(error.message);
  }
}
