import { API_ERROR, getInternalError } from '@verdaccio/commons-api';

interface MinioError extends Error {
  code?: string;
  key?: string;
  resource?: string;
}

/**
 * Custom Error class implementing the required fields for Verdaccio to determine
 * what kind of error this is. The status code is the HTTP equivalent of the error,
 * and the code is the FS equivalent error code.
 */
class CustomError extends Error {
  public code: string;
  public status: number;
  public statusCode: number;

  public constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.statusCode = status;
  }
}

export const NOT_FOUND = new CustomError(API_ERROR.NO_PACKAGE, 'ENOENT', 404);
export const INTERNAL = new CustomError(API_ERROR.UNKNOWN_ERROR, 'UNKNOWN', 500);

/**
 * Common error constants from Minio
 */
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
export function wrap(error: MinioError): CustomError {
  if (!hasCode(error)) {
    return getInternalError(error.message);
  }

  switch (error.code) {
    case MINIO.NO_SUCH_KEY:
    case MINIO.NOT_FOUND:
      return NOT_FOUND;
    default:
      return INTERNAL;
  }
}
