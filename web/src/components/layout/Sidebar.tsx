import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { ROLE_LABELS, type UserRole } from '../../lib/roles';
import type { NavItem } from './nav-types';

export interface SidebarProps {
  role: UserRole;
  schoolName?: string;
  userLabel?: string;
  footerNote?: string;
  footerControl?: ReactNode;
  items: ReadonlyArray<NavItem>;
  activePath: string;
  onNavigate?: (path: string) => void;
  embedded?: boolean;
}

export function Sidebar({
  role,
  schoolName = 'Trường PTDTNT [TÊN TRƯỜNG]',
  userLabel,
  footerNote,
  footerControl,
  items,
  activePath,
  onNavigate,
  embedded = false,
}: SidebarProps) {
  return (
    <aside
      aria-label="Điều hướng chính trên máy tính"
      className={cx(
        'hidden w-[240px] shrink-0 flex-col bg-forest-900 text-cream md:flex',
        !embedded && 'md:sticky md:top-[6px] md:h-[calc(100vh-6px)]',
      )}
    >
      <div className="border-b border-cream/15 px-5 py-4">
        <p className="text-[19px] font-bold tracking-[-0.01em] text-surface">BẢN NHÀ</p>
        <p className="mt-0.5 truncate text-[13px] text-cream/75">{schoolName}</p>
      </div>

      <nav aria-label="Danh mục chức năng" className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2.5 text-[12px] font-medium text-cream/60">{ROLE_LABELS[role]}</p>
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === activePath;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate?.(item.path)}
                  className={cx(
                    'flex min-h-[40px] w-full items-center justify-between gap-2 rounded-[6px] border-l-[3px] px-2.5 py-2 text-left text-[14px] font-medium transition-colors duration-150',
                    isActive
                      ? 'border-turmeric bg-surface/10 font-semibold text-surface'
                      : 'border-transparent text-cream/85 hover:bg-surface/5 hover:text-surface',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon size={17} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="font-mono text-[12px] font-semibold tabular-nums text-turmeric">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 border-t border-cream/15 px-4 py-3.5 text-[13px]">
        {userLabel ? <p className="truncate font-semibold text-surface">{userLabel}</p> : null}
        {footerNote ? <p className="text-[12px] text-cream/70">{footerNote}</p> : null}
        {footerControl}
      </div>
    </aside>
  );
}
