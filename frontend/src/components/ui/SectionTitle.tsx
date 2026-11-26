import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionTitle({ title, subtitle, action, className }: SectionTitleProps) {
  return (
    <div className={cx('flex items-baseline justify-between gap-3', className)}>
      <div>
        <h2 className="text-[length:var(--font-size-section)] font-bold tracking-[-0.01em] text-clay-600">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[length:var(--font-size-sub)] text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
