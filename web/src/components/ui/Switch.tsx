import { cx } from '../../lib/cx';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  className?: string;
}

export function Switch({ label, description, checked, onCheckedChange, className }: SwitchProps) {
  return (
    <div className={cx('flex items-center justify-between gap-3 py-1', className)}>
      <div>
        <p className="text-[length:var(--font-size-body)] font-semibold text-ink">{label}</p>
        {description ? (
          <p className="text-[length:var(--font-size-sub)] text-muted">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cx(
          'relative inline-flex h-8 w-14 min-w-[56px] shrink-0 items-center rounded-pill border p-1 transition-colors duration-150',
          checked ? 'border-forest-700 bg-forest-700' : 'border-line bg-forest-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            'block h-6 w-6 rounded-pill border transition-transform duration-150',
            checked
              ? 'translate-x-5 border-surface bg-surface'
              : 'translate-x-0 border-line bg-surface',
          )}
        />
      </button>
    </div>
  );
}
