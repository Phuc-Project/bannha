import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  id,
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[length:var(--font-size-body)] font-semibold text-ink">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-[length:var(--font-size-sub)] text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[length:var(--font-size-sub)] font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
