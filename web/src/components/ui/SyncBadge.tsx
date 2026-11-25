import { RefreshCw } from 'lucide-react';
import { cx } from '../../lib/cx';

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export interface SyncLabelInput {
  status: SyncStatus;
  minutesAgo?: number;
  pendingCount?: number;
}

export function formatSyncLabel({
  status,
  minutesAgo = 0,
  pendingCount = 1,
}: SyncLabelInput): string {
  switch (status) {
    case 'synced':
      return minutesAgo <= 0 ? 'Vừa đồng bộ xong' : `Đã đồng bộ ${minutesAgo} phút trước`;
    case 'syncing':
      return 'Đang đồng bộ…';
    case 'pending':
      return `Đang chờ gửi ${pendingCount} mục`;
    case 'offline':
      return 'Đang ngoại tuyến';
    case 'error':
      return `Chưa gửi được ${pendingCount} mục`;
  }
}

export interface SyncBadgeProps extends SyncLabelInput {
  surface?: 'dark' | 'light';
  onRetry?: () => void;
  className?: string;
}

const DOT_CLASSES: Record<SyncStatus, string> = {
  synced: 'bg-success',
  syncing: 'bg-turmeric motion-safe:animate-pulse',
  pending: 'bg-turmeric',
  offline: 'bg-cream border border-ink',
  error: 'bg-danger',
};

export function SyncBadge({
  status,
  minutesAgo,
  pendingCount,
  surface = 'light',
  onRetry,
  className,
}: SyncBadgeProps) {
  const label = formatSyncLabel({ status, minutesAgo, pendingCount });
  const containerStyles =
    surface === 'dark'
      ? 'border-forest-700 bg-forest-900 text-cream'
      : 'border-line bg-surface text-ink';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        'inline-flex items-center gap-2 rounded-pill border px-3 py-1 text-[length:var(--font-size-sub)] font-medium',
        containerStyles,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx('h-2.5 w-2.5 shrink-0 rounded-pill', DOT_CLASSES[status])}
      />
      <span>{label}</span>
      {status === 'error' && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cx(
            'ml-1 inline-flex min-h-[28px] items-center gap-1 rounded-pill px-2 text-[length:var(--font-size-sub)] font-semibold underline underline-offset-2',
            surface === 'dark' ? 'text-turmeric' : 'text-clay-600',
          )}
        >
          <RefreshCw size={13} strokeWidth={1.75} aria-hidden="true" />
          <span>Thử lại</span>
        </button>
      ) : null}
    </div>
  );
}
