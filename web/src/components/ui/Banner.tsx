import { AlertCircle, CheckCircle2, Info, WifiOff } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Button } from './Button';

export type BannerTone = 'offline' | 'danger' | 'info' | 'success';

export interface BannerProps {
  tone?: BannerTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function Banner({
  tone = 'info',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: BannerProps) {
  const Icon =
    tone === 'offline'
      ? WifiOff
      : tone === 'danger'
        ? AlertCircle
        : tone === 'success'
          ? CheckCircle2
          : Info;

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(
        'flex flex-col gap-3 rounded-card border border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between',
        tone === 'offline' && 'border-turmeric border-l-clay-600 bg-turmeric-50 text-ink',
        tone === 'danger' && 'border-danger bg-surface text-ink',
        tone === 'success' && 'border-success bg-surface text-ink',
        tone === 'info' && 'border-line border-l-forest-700 bg-surface text-ink',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className={cx(
            'mt-0.5 shrink-0',
            tone === 'offline' && 'text-clay-600',
            tone === 'danger' && 'text-danger',
            tone === 'success' && 'text-success',
            tone === 'info' && 'text-forest-700',
          )}
        />
        <div>
          <p className="text-[length:var(--font-size-body)] font-semibold text-ink">{title}</p>
          {description ? (
            <p className="mt-0.5 text-[length:var(--font-size-sub)] text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actionLabel && onAction ? (
        <div className="shrink-0">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
