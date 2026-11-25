import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { SyncBadge, type SyncBadgeProps } from '../ui/SyncBadge';
import { TribalStripe } from '../ui/TribalStripe';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  syncState: Omit<SyncBadgeProps, 'inverted'>;
  action?: ReactNode;
  embedded?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  syncState,
  action,
  embedded = false,
}: AppHeaderProps) {
  return (
    <header
      className={cx(
        'w-full bg-forest-900 text-surface',
        !embedded && 'sticky top-0 z-30',
      )}
    >
      <TribalStripe />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-[length:var(--font-size-section)] font-bold tracking-[-0.01em] text-surface">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-[length:var(--font-size-sub)] text-cream/85">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <SyncBadge {...syncState} inverted />
          {action}
        </div>
      </div>
    </header>
  );
}
