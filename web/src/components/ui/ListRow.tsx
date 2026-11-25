import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cx } from '../../lib/cx';

export interface ListRowProps {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: ListRowProps) {
  const content = (
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[length:var(--font-size-body)] font-semibold text-ink">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-[length:var(--font-size-sub)] text-muted">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? (
        <div className="shrink-0">{trailing}</div>
      ) : onClick ? (
        <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-muted" />
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cx(
          'flex min-h-[var(--control-height)] w-full items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-forest-50',
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cx('flex min-h-[var(--control-height)] items-center gap-3 px-4 py-3', className)}>
      {content}
    </div>
  );
}
