import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  allowRevealPassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, allowRevealPassword = false, type = 'text', id, className, ...rest },
  ref,
) {
  const [revealed, setRevealed] = useState(false);
  const canToggle = type === 'password' && allowRevealPassword;
  const effectiveType = canToggle && revealed ? 'text' : type;

  const inputNode = (
    <input
      ref={ref}
      id={id}
      type={effectiveType}
      aria-invalid={hasError ? 'true' : undefined}
      aria-describedby={hasError && id ? `${id}-error` : undefined}
      className={cx(
        'min-h-[var(--control-height)] w-full rounded-control border bg-surface px-3.5 py-2 text-[length:var(--font-size-body)] text-ink placeholder:text-muted transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-forest-50',
        hasError ? 'border-danger' : 'border-line focus:border-forest-700',
        canToggle && 'pr-12',
        className,
      )}
      {...rest}
    />
  );

  if (!canToggle) return inputNode;

  return (
    <div className="relative flex items-center">
      {inputNode}
      <button
        type="button"
        aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        onClick={() => setRevealed((prev) => !prev)}
        className="absolute right-1 inline-flex h-11 w-11 items-center justify-center rounded-control text-muted hover:text-ink"
      >
        {revealed ? (
          <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
