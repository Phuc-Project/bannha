import { useId, type InputHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  return (
    <label
      htmlFor={inputId}
      className={cx(
        'inline-flex min-h-[44px] cursor-pointer items-center gap-3 py-1.5 text-[length:var(--font-size-body)] text-ink',
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className="h-5 w-5 shrink-0 rounded border-line accent-forest-700"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}
