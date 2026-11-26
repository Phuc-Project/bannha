import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { hasError = false, id, className, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      aria-invalid={hasError ? 'true' : undefined}
      aria-describedby={hasError && id ? `${id}-error` : undefined}
      className={cx(
        'w-full rounded-control border bg-surface px-3.5 py-2.5 text-[length:var(--font-size-body)] text-ink placeholder:text-muted transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-forest-50',
        hasError ? 'border-danger' : 'border-line focus:border-forest-700',
        className,
      )}
      {...rest}
    />
  );
});
