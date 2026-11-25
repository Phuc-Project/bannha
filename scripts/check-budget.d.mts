export const MAX_INITIAL_GZIP_BYTES: number;

export interface BundleFileStat {
  file: string;
  gzipBytes: number;
}

export interface InitialBundleReport {
  files: BundleFileStat[];
  totalGzipBytes: number;
}

export function analyzeInitialBundleGzip(distDir: string): InitialBundleReport;
