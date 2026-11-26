import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { SyncBadge, type SyncBadgeProps } from '../ui/SyncBadge';
import { TribalStripe } from '../ui/TribalStripe';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  syncState: Omit<SyncBadgeProps, 'inverted' | 'responsiveWorkspace'>;
  action?: ReactNode;
  variant?: 'forest' | 'workspace';
  showStripe?: boolean;
  embedded?: boolean;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  syncState,
  action,
  variant = 'workspace',
  showStripe = false,
  embedded = false,
  className,
}: AppHeaderProps) {
  const isWorkspace = variant === 'workspace';

  return (
    <header
      className={cx(
        'w-full',
        isWorkspace
          ? 'bg-forest-900 text-surface md:border-b md:border-line md:bg-surface md:text-ink'
          : 'bg-forest-900 text-surface',
        !embedded && (isWorkspace ? 'sticky top-[6px] z-30' : 'sticky top-0 z-30'),
        className,
      )}
    >
      {!isWorkspace && showStripe ? <TribalStripe /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:min-h-[58px] md:px-6">
        <div className="min-w-0">
          <h1
            className={cx(
              'truncate text-[18px] font-bold tracking-[-0.01em] md:text-[19px]',
              isWorkspace ? 'text-surface md:text-ink' : 'text-surface',
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cx(
                'truncate text-[13px]',
                isWorkspace ? 'text-cream/80 md:text-muted' : 'text-cream/80',
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SyncBadge {...syncState} inverted={!isWorkspace} responsiveWorkspace={isWorkspace} />
          {action}
        </div>
      </div>
    </header>
  );
}
