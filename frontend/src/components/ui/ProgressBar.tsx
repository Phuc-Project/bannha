import { cx } from '../../lib/cx';

export interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  valueText?: string;
  className?: string;
}

export function ProgressBar({ label, value, max = 10, valueText, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = max > 0 ? Math.round((clamped / max) * 100) : 0;

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[length:var(--font-size-body)] font-semibold text-ink">{label}</span>
        <span className="text-[length:var(--font-size-sub)] font-semibold text-forest-700">
          {valueText ?? `${clamped}/${max}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        className="h-2.5 w-full overflow-hidden rounded-pill border border-line bg-forest-50"
      >
        <div
          style={{ width: `${pct}%` }}
          className="h-full rounded-pill bg-forest-700 transition-all duration-150"
        />
      </div>
    </div>
  );
}
