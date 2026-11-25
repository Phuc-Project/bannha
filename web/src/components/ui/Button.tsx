import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-forest-700 bg-forest-700 text-surface hover:bg-forest-900 active:bg-forest-900',
  secondary: 'border-line bg-surface text-ink hover:bg-forest-50 active:bg-forest-50',
  tonal: 'border-line bg-forest-50 text-forest-700 hover:border-forest-700',
  danger: 'border-danger bg-danger text-surface hover:opacity-95',
  ghost: 'border-transparent bg-transparent text-forest-700 hover:bg-forest-50',
};

export function Button({
  variant = 'primary',
  icon: Icon,
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex min-h-[var(--control-height)] min-w-[44px] items-center justify-center gap-2 rounded-control border px-4 py-2 text-[length:var(--font-size-body)] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 rounded-pill border-2 border-current border-t-transparent motion-safe:animate-spin"
        />
      ) : Icon ? (
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
