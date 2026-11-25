import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
}

export function Chip({
  selected = false,
  icon: Icon,
  type = 'button',
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'inline-flex min-h-[44px] items-center gap-2 rounded-pill border px-3.5 py-1.5 text-[length:var(--font-size-sub)] font-semibold transition-colors duration-150',
        selected
          ? 'border-forest-700 bg-forest-700 text-surface'
          : 'border-line bg-forest-50 text-ink hover:border-forest-700',
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={16} strokeWidth={1.75} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
