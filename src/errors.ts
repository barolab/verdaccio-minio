import { getNotFound, getInternalError, VerdaccioError } from '@verdaccio/commons-api';

const hasCode = (err: Error) => 'code' in err;
interface MinioError extends Error {
  code?: string;
  key?: string;
  resource?: string;
}

export const NO_SUCH_KEY = 'NoSuchKey';
export const NOT_FOUND = 'NotFound';

export function isNotFound(error: MinioError): boolean {
  return error.code === NOT_FOUND || error.code == NO_SUCH_KEY;
}

export function wrap(error: MinioError): VerdaccioError {
  if (!hasCode(error)) {
    return getInternalError(error.message);
  }

  switch (error.code) {
    case NOT_FOUND:
    case NO_SUCH_KEY:
      return getNotFound();
    default:
      return getInternalError(error.message);
  }
}
