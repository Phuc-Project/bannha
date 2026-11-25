export declare const MAX_INITIAL_GZIP_BYTES: number;

export interface BundleFileStat {
  file: string;
  gzipBytes: number;
}

export interface InitialBundleReport {
  files: BundleFileStat[];
  totalGzipBytes: number;
}

export declare function analyzeInitialBundleGzip(distDir: string): InitialBundleReport;
