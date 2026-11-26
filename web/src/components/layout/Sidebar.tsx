import { cx } from '../../lib/cx';
import { ROLE_LABELS, type UserRole } from '../../lib/roles';
import type { NavItem } from './nav-types';

export interface SidebarProps {
  role: UserRole;
  schoolName?: string;
  userLabel?: string;
  footerNote?: string;
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
  items,
  activePath,
  onNavigate,
  embedded = false,
}: SidebarProps) {
  return (
    <aside
      aria-label="Điều hướng nhân viên"
      className={cx(
        'hidden w-[264px] shrink-0 flex-col border-r border-line bg-surface lg:flex',
        !embedded && 'lg:sticky lg:top-[6px] lg:h-[calc(100vh-6px)]',
      )}
    >
      <div className="border-b border-line bg-forest-900 px-4 py-4 text-surface">
        <p className="text-lg font-bold tracking-[-0.01em] text-surface">BẢN NHÀ</p>
        <p className="mt-0.5 truncate text-[length:var(--font-size-sub)] text-cream/85">
          {schoolName}
        </p>
        <span className="mt-2.5 inline-flex items-center rounded-pill border border-turmeric px-2.5 py-0.5 text-xs font-semibold text-turmeric">
          {ROLE_LABELS[role]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold text-muted">Điều hành hằng ngày</p>
        <ul className="flex flex-col gap-1">
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
                    'flex min-h-[var(--control-height)] w-full items-center justify-between gap-2 rounded-control px-3 py-2 text-left text-[length:var(--font-size-body)] font-semibold transition-colors duration-150',
                    isActive ? 'bg-forest-700 text-surface' : 'text-ink hover:bg-forest-50',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon size={19} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span
                      className={cx(
                        'inline-flex min-w-[24px] items-center justify-center rounded-pill px-2 py-0.5 text-xs font-bold',
                        isActive ? 'bg-turmeric text-ink' : 'bg-forest-50 text-forest-700',
                      )}
                    >
                      {item.badgeCount}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {userLabel || footerNote ? (
        <div className="mt-auto border-t border-line bg-cream/70 px-4 py-3">
          {userLabel ? (
            <p className="truncate text-[length:var(--font-size-sub)] font-bold text-ink">
              {userLabel}
            </p>
          ) : null}
          {footerNote ? (
            <p className="mt-0.5 text-[length:var(--font-size-sub)] text-muted">{footerNote}</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
