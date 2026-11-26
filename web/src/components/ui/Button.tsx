import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-forest-700 bg-forest-700 text-surface hover:bg-forest-900 active:bg-forest-900',
  secondary: 'border-line bg-surface text-ink hover:bg-cream active:bg-forest-50',
  tonal: 'border-line bg-forest-50 text-forest-700 hover:border-forest-700',
  danger: 'border-danger bg-danger text-surface hover:opacity-95',
  ghost: 'border-transparent bg-transparent text-forest-700 hover:bg-forest-50',
};

export function Button({
  variant = 'primary',
  size = 'md',
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
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] border font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm'
          ? 'min-h-[38px] px-3 py-1.5 text-[13px] md:min-h-[32px]'
          : 'min-h-[var(--control-height)] min-w-[44px] px-3.5 py-2 text-[length:var(--font-size-sub)] md:min-h-[38px]',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
        />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 15 : 16} strokeWidth={1.75} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
