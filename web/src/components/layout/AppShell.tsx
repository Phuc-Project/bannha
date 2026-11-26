import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { isStaffRole, type UserRole } from '../../lib/roles';
import type { SyncBadgeProps } from '../ui/SyncBadge';
import { TribalStripe } from '../ui/TribalStripe';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import type { NavItem } from './nav-types';
import { Sidebar } from './Sidebar';

export type { NavItem } from './nav-types';

export interface AppShellProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  schoolName?: string;
  sidebarFooter?: string;
  syncState: Omit<SyncBadgeProps, 'inverted' | 'responsiveWorkspace'>;
  headerAction?: ReactNode;
  navItems: ReadonlyArray<NavItem>;
  activePath: string;
  onNavigate?: (path: string) => void;
  embedded?: boolean;
  forceViewport?: 'responsive' | 'mobile';
  children: ReactNode;
}

export function AppShell({
  role,
  title,
  subtitle,
  schoolName,
  sidebarFooter,
  syncState,
  headerAction,
  navItems,
  activePath,
  onNavigate,
  embedded = false,
  forceViewport = 'responsive',
  children,
}: AppShellProps) {
  const showDesktopSidebar = isStaffRole(role) && forceViewport !== 'mobile';

  if (showDesktopSidebar) {
    return (
      <div
        className={cx(
          'flex flex-col bg-cream text-ink',
          embedded
            ? 'min-h-[600px] overflow-hidden rounded-card border border-line'
            : 'min-h-screen',
        )}
      >
        <div className={cx(!embedded && 'sticky top-0 z-40')}>
          <TribalStripe />
        </div>

        <div className="flex min-w-0 flex-1">
          <Sidebar
            role={role}
            schoolName={schoolName}
            userLabel={subtitle}
            footerNote={sidebarFooter}
            items={navItems}
            activePath={activePath}
            onNavigate={onNavigate}
            embedded={embedded}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader
              title={title}
              subtitle={subtitle}
              syncState={syncState}
              action={headerAction}
              variant="workspace"
              showStripe={false}
              embedded={embedded}
            />

            <main
              className={cx(
                'min-w-0 flex-1 px-4 py-4 lg:px-6 lg:py-6',
                !embedded && 'pb-20 lg:pb-8',
              )}
            >
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>

        <BottomNav
          items={navItems}
          activePath={activePath}
          onNavigate={onNavigate}
          hideOnDesktop
          embedded={embedded}
        />
      </div>
    );
  }

  return (
    <div
      className={cx(
        'flex flex-col bg-cream text-ink',
        embedded ? 'min-h-[560px] overflow-hidden rounded-card border border-line' : 'min-h-screen',
      )}
    >
      <AppHeader
        title={title}
        subtitle={subtitle}
        syncState={syncState}
        action={headerAction}
        variant="forest"
        embedded={embedded}
      />

      <main
        className={cx(
          'min-w-0 flex-1 px-4 py-4',
          forceViewport === 'responsive' && 'lg:px-6 lg:py-6',
          !embedded && 'pb-24',
        )}
      >
        <div className={cx('mx-auto', forceViewport === 'mobile' ? 'max-w-full' : 'max-w-5xl')}>
          {children}
        </div>
      </main>

      <BottomNav
        items={navItems}
        activePath={activePath}
        onNavigate={onNavigate}
        embedded={embedded}
      />
    </div>
  );
}
