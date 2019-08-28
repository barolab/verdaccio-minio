interface MinioError extends Error {
  code: string;
  key?: string;
  resource?: string;
}

export const NO_SUCH_KEY = 'NoSuchKey';
export const NOT_FOUND = 'NotFound';

export function isNotFound(error: MinioError): boolean {
  return error.code === NOT_FOUND || error.code == NO_SUCH_KEY;
}
