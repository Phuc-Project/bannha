import { cx } from '../../lib/cx';
import type { NavItem } from './nav-types';

export interface BottomNavProps {
  items: ReadonlyArray<NavItem>;
  activePath: string;
  onNavigate?: (path: string) => void;
  hideOnDesktop?: boolean;
  embedded?: boolean;
}

export function BottomNav({
  items,
  activePath,
  onNavigate,
  hideOnDesktop = false,
  embedded = false,
}: BottomNavProps) {
  const cappedItems = items.slice(0, 5);

  return (
    <nav
      aria-label="Điều hướng chính"
      className={cx(
        'w-full border-t border-line bg-surface',
        !embedded && 'fixed inset-x-0 bottom-0 z-30',
        hideOnDesktop && 'lg:hidden',
      )}
    >
      <ul className="mx-auto grid max-w-2xl grid-flow-col auto-cols-fr">
        {cappedItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === activePath;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate?.(item.path)}
                className={cx(
                  'flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1.5 text-[12px] font-semibold transition-colors duration-150',
                  isActive ? 'text-forest-700' : 'text-muted hover:text-ink',
                )}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
