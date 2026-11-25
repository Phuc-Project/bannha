import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  id?: string;
}

/** Section heading: 20px (scales to 22px in large text), clay-600, never uppercase */
export function SectionTitle({ title, subtitle, action, className, id }: SectionTitleProps) {
  return (
    <div className={cx('flex flex-wrap items-baseline justify-between gap-2', className)}>
      <div>
        <h2
          id={id}
          className="text-[length:var(--font-size-section)] font-bold tracking-[-0.01em] text-clay-600"
        >
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
