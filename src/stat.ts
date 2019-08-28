export interface PackageStat {
  metaData: Record<string, any>;
  name: string;
  path: string;
  etag: string;
  size: number;
  time: number;
}
