import { cx } from '../../lib/cx';
import { ROLE_LABELS, type UserRole } from '../../lib/roles';
import type { NavItem } from './nav-types';

export interface SidebarProps {
  role: UserRole;
  items: ReadonlyArray<NavItem>;
  activePath: string;
  onNavigate?: (path: string) => void;
}

export function Sidebar({ role, items, activePath, onNavigate }: SidebarProps) {
  return (
    <aside
      aria-label="Điều hướng nhân viên"
      className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex"
    >
      <div className="mb-4 border-b border-line pb-3">
        <p className="text-[length:var(--font-size-body)] font-bold text-forest-900">BẢN NHÀ</p>
        <p className="text-[length:var(--font-size-sub)] text-muted">{ROLE_LABELS[role]}</p>
      </div>
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
                  'flex min-h-[var(--control-height)] w-full items-center gap-3 rounded-control px-3 py-2 text-left text-[length:var(--font-size-body)] font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-forest-700 text-surface'
                    : 'text-ink hover:bg-forest-50',
                )}
              >
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
