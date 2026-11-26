import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  'aria-label': string;
  variant?: 'surface' | 'tonal' | 'ghost';
}

export function IconButton({
  icon: Icon,
  variant = 'surface',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex min-h-[var(--control-height)] min-w-[var(--control-height)] items-center justify-center rounded-control border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'surface' && 'border-line bg-surface text-ink hover:bg-forest-50',
        variant === 'tonal' && 'border-line bg-forest-50 text-forest-700',
        variant === 'ghost' && 'border-transparent bg-transparent text-ink hover:bg-forest-50',
        className,
      )}
      {...rest}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
