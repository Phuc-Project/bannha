import { AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react';
import { cx } from '../../lib/cx';

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface StatusBadgeProps {
  tone?: StatusTone;
  label: string;
  className?: string;
}

const TONE_MAP: Record<StatusTone, { classes: string; Icon: typeof Info }> = {
  neutral: {
    classes: 'border-line bg-surface text-ink',
    Icon: Info,
  },
  info: {
    classes: 'border-line bg-forest-50 text-forest-700',
    Icon: Info,
  },
  warning: {
    classes: 'border-turmeric bg-turmeric-50 text-clay-600',
    Icon: Clock,
  },
  success: {
    classes: 'border-success bg-surface text-success',
    Icon: CheckCircle2,
  },
  danger: {
    classes: 'border-danger bg-surface text-danger',
    Icon: AlertCircle,
  },
};

export function StatusBadge({ tone = 'neutral', label, className }: StatusBadgeProps) {
  const { classes, Icon } = TONE_MAP[tone];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[length:var(--font-size-sub)] font-medium leading-tight',
        classes,
        className,
      )}
    >
      <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
