import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { UserRole } from '../../lib/roles';
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
  sidebarControl?: ReactNode;
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
  sidebarControl,
  syncState,
  headerAction,
  navItems,
  activePath,
  onNavigate,
  embedded = false,
  forceViewport = 'responsive',
  children,
}: AppShellProps) {
  const isForcedMobile = forceViewport === 'mobile';

  return (
    <div
      className={cx(
        'flex flex-col bg-cream text-ink',
        embedded
          ? 'min-h-[580px] overflow-hidden rounded-[8px] border border-line'
          : 'min-h-screen',
      )}
    >
      <div className={cx(!embedded && 'sticky top-0 z-40')}>
        <TribalStripe />
      </div>

      <div className="flex min-w-0 flex-1">
        {!isForcedMobile ? (
          <Sidebar
            role={role}
            schoolName={schoolName}
            userLabel={subtitle}
            footerNote={sidebarFooter}
            footerControl={sidebarControl}
            items={navItems}
            activePath={activePath}
            onNavigate={onNavigate}
            embedded={embedded}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            title={title}
            subtitle={subtitle}
            syncState={syncState}
            action={headerAction}
            variant={isForcedMobile ? 'forest' : 'workspace'}
            showStripe={false}
            embedded={embedded}
          />

          <main
            className={cx('min-w-0 flex-1 px-4 py-4 md:px-6 md:py-5', !embedded && 'pb-20 md:pb-8')}
          >
            <div className={cx('mx-auto', !isForcedMobile && 'max-w-[1280px]')}>{children}</div>
          </main>
        </div>
      </div>

      <BottomNav
        items={navItems}
        activePath={activePath}
        onNavigate={onNavigate}
        forceShow={isForcedMobile}
        embedded={embedded}
      />
    </div>
  );
}
