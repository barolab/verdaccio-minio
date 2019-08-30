export interface PackageStat {
  metaData: Record<string, object | string | number | boolean>;
  name: string;
  path: string;
  etag: string;
  size: number;
  time: number;
}
