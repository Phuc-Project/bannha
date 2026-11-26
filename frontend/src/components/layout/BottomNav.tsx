import { cx } from '../../lib/cx';
import type { NavItem } from './nav-types';

export interface BottomNavProps {
  items: ReadonlyArray<NavItem>;
  activePath: string;
  onNavigate?: (path: string) => void;
  forceShow?: boolean;
  embedded?: boolean;
}

/**
 * Mobile-only bottom tab bar (< 768px / F12 mobile viewport).
 * Strictly hidden on Desktop (>= 768px) unless forceShow is passed for mobile preview.
 */
export function BottomNav({
  items,
  activePath,
  onNavigate,
  forceShow = false,
  embedded = false,
}: BottomNavProps) {
  const cappedItems = items.slice(0, 5);

  return (
    <nav
      aria-label="Điều hướng di động"
      className={cx(
        'w-full border-t border-line bg-surface',
        !embedded && 'fixed inset-x-0 bottom-0 z-30',
        !forceShow && 'md:hidden',
      )}
    >
      <ul className="grid grid-flow-col auto-cols-fr">
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
                  'relative flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1.5 text-[12px] font-medium transition-colors duration-150',
                  isActive ? 'font-semibold text-forest-700' : 'text-muted hover:text-ink',
                )}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 top-0 h-[2px] bg-forest-700"
                  />
                ) : null}
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
