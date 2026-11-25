import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { isStaffRole, type UserRole } from '../../lib/roles';
import type { SyncBadgeProps } from '../ui/SyncBadge';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import type { NavItem } from './nav-types';
import { Sidebar } from './Sidebar';

export type { NavItem } from './nav-types';

export interface AppShellProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  syncState: Omit<SyncBadgeProps, 'inverted'>;
  headerAction?: ReactNode;
  navItems: ReadonlyArray<NavItem>;
  activePath: string;
  onNavigate?: (path: string) => void;
  embedded?: boolean;
  children: ReactNode;
}

export function AppShell({
  role,
  title,
  subtitle,
  syncState,
  headerAction,
  navItems,
  activePath,
  onNavigate,
  embedded = false,
  children,
}: AppShellProps) {
  const showDesktopSidebar = isStaffRole(role);

  return (
    <div
      className={cx(
        'flex flex-col bg-cream text-ink',
        embedded ? 'min-h-[540px] overflow-hidden rounded-card border border-line' : 'min-h-screen',
      )}
    >
      <AppHeader
        title={title}
        subtitle={subtitle}
        syncState={syncState}
        action={headerAction}
        embedded={embedded}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1">
        {showDesktopSidebar ? (
          <Sidebar
            role={role}
            items={navItems}
            activePath={activePath}
            onNavigate={onNavigate}
          />
        ) : null}

        <main
          className={cx(
            'min-w-0 flex-1 px-4 py-4',
            !embedded && (showDesktopSidebar ? 'pb-20 lg:pb-6' : 'pb-20'),
          )}
        >
          <div className={cx(!showDesktopSidebar && 'mx-auto max-w-2xl')}>{children}</div>
        </main>
      </div>

      <BottomNav
        items={navItems}
        activePath={activePath}
        onNavigate={onNavigate}
        hideOnDesktop={showDesktopSidebar}
        embedded={embedded}
      />
    </div>
  );
}
