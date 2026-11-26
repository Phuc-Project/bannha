import { cx } from '../../lib/cx';

export type StatusTone = 'neutral' | 'forest' | 'warning' | 'success' | 'danger';

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

const TONE_CLASSES: Record<StatusTone, { wrapper: string; dot: string }> = {
  neutral: {
    wrapper: 'bg-cream text-muted border-line',
    dot: 'bg-muted',
  },
  forest: {
    wrapper: 'bg-forest-50 text-forest-700 border-forest-50',
    dot: 'bg-forest-700',
  },
  warning: {
    wrapper: 'bg-turmeric-50 text-clay-600 border-turmeric/60',
    dot: 'bg-clay-600',
  },
  success: {
    wrapper: 'bg-surface text-success border-line',
    dot: 'bg-success',
  },
  danger: {
    wrapper: 'bg-surface text-danger border-danger/40',
    dot: 'bg-danger',
  },
};

export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  const styles = TONE_CLASSES[tone];
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-2 py-0.5 text-[13px] font-medium leading-snug',
        styles.wrapper,
        className,
      )}
    >
      <span aria-hidden="true" className={cx('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)} />
      <span>{label}</span>
    </span>
  );
}
