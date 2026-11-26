import { cx } from '../../lib/cx';

export type StatusTone = 'neutral' | 'forest' | 'warning' | 'success' | 'danger';

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

const TONE_CLASSES: Record<StatusTone, { wrapper: string; dot: string }> = {
  neutral: {
    wrapper: 'border-line bg-surface text-ink',
    dot: 'bg-muted',
  },
  forest: {
    wrapper: 'border-line bg-forest-50 text-forest-700',
    dot: 'bg-forest-700',
  },
  warning: {
    wrapper: 'border-turmeric bg-turmeric-50 text-clay-600',
    dot: 'bg-clay-600',
  },
  success: {
    wrapper: 'border-success bg-surface text-success',
    dot: 'bg-success',
  },
  danger: {
    wrapper: 'border-danger bg-surface text-danger',
    dot: 'bg-danger',
  },
};

export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  const styles = TONE_CLASSES[tone];
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 py-1 text-[length:var(--font-size-sub)] font-medium leading-tight',
        styles.wrapper,
        className,
      )}
    >
      <span aria-hidden="true" className={cx('h-2 w-2 shrink-0 rounded-pill', styles.dot)} />
      <span>{label}</span>
    </span>
  );
}
