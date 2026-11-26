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
  variant = 'forest',
  showStripe = true,
  embedded = false,
  className,
}: AppHeaderProps) {
  const isWorkspace = variant === 'workspace';

  return (
    <header
      className={cx(
        'w-full',
        isWorkspace
          ? 'bg-forest-900 text-surface lg:border-b lg:border-line lg:bg-surface lg:text-ink'
          : 'bg-forest-900 text-surface',
        !embedded && (isWorkspace ? 'sticky top-[6px] z-30' : 'sticky top-0 z-30'),
        className,
      )}
    >
      {!isWorkspace && showStripe ? <TribalStripe /> : null}
      <div
        className={cx(
          'mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6',
          isWorkspace ? 'max-w-7xl' : 'max-w-5xl',
        )}
      >
        <div className="min-w-0">
          <h1
            className={cx(
              'truncate text-[length:var(--font-size-section)] font-bold tracking-[-0.01em]',
              isWorkspace ? 'text-surface lg:text-ink' : 'text-surface',
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cx(
                'truncate text-[length:var(--font-size-sub)]',
                isWorkspace ? 'text-cream/85 lg:text-muted' : 'text-cream/85',
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SyncBadge {...syncState} inverted={!isWorkspace} responsiveWorkspace={isWorkspace} />
          {action}
        </div>
      </div>
    </header>
  );
}
