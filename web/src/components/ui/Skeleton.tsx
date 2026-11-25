import { cx } from '../../lib/cx';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('rounded-control bg-forest-50 motion-safe:animate-pulse', className)}
    />
  );
}
