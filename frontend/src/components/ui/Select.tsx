import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: ReadonlyArray<SelectOption>;
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, hasError = false, id, className, ...rest },
  ref,
) {
  return (
    <div className="relative flex items-center">
      <select
        ref={ref}
        id={id}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError && id ? `${id}-error` : undefined}
        className={cx(
          'min-h-[var(--control-height)] w-full appearance-none rounded-control border bg-surface py-2 pl-3.5 pr-10 text-[length:var(--font-size-body)] text-ink transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-forest-50',
          hasError ? 'border-danger' : 'border-line focus:border-forest-700',
          className,
        )}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-muted"
      />
    </div>
  );
});
