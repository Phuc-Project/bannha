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
  pendingCount = 0,
}: SyncLabelInput): string {
  switch (status) {
    case 'synced':
      return minutesAgo <= 0 ? 'Vừa đồng bộ xong' : `Đã đồng bộ ${minutesAgo} phút trước`;
    case 'syncing':
      return 'Đang đồng bộ…';
    case 'pending':
      return `Đang chờ gửi ${Math.max(1, pendingCount)} mục`;
    case 'offline':
      return 'Đang ngoại tuyến';
    case 'error':
      return `Chưa gửi được ${Math.max(1, pendingCount)} mục`;
  }
}

export interface SyncBadgeProps extends SyncLabelInput {
  inverted?: boolean;
  responsiveWorkspace?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function SyncBadge({
  status,
  minutesAgo,
  pendingCount,
  inverted = false,
  responsiveWorkspace = false,
  onRetry,
  className,
}: SyncBadgeProps) {
  const label = formatSyncLabel({ status, minutesAgo, pendingCount });

  const dotClass =
    status === 'synced'
      ? 'bg-success'
      : status === 'syncing' || status === 'pending'
        ? 'bg-turmeric'
        : status === 'offline'
          ? responsiveWorkspace
            ? 'bg-cream lg:bg-muted'
            : inverted
              ? 'bg-cream'
              : 'bg-muted'
          : 'bg-danger';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        'inline-flex items-center gap-2 rounded-pill border px-3 py-1 text-[length:var(--font-size-sub)] font-medium',
        responsiveWorkspace
          ? 'border-cream/30 bg-forest-900 text-cream lg:border-line lg:bg-surface lg:text-ink'
          : inverted
            ? 'border-cream/30 bg-forest-900 text-cream'
            : 'border-line bg-surface text-ink',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'h-2.5 w-2.5 shrink-0 rounded-pill',
          dotClass,
          status === 'syncing' && 'motion-safe:animate-pulse',
        )}
      />
      <span>{label}</span>
      {status === 'error' && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cx(
            'ml-1 rounded-pill px-2 py-0.5 font-semibold underline underline-offset-2',
            responsiveWorkspace
              ? 'text-turmeric lg:text-danger'
              : inverted
                ? 'text-turmeric'
                : 'text-danger',
          )}
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
