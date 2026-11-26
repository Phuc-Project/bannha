import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { IconTile } from './IconTile';
import { cx } from '../../lib/cx';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
}

/**
 * Plain, direct empty state that always pairs with a concrete verb button (§3.5).
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-4',
        className,
      )}
    >
      {icon ? <IconTile icon={icon} /> : null}
      <div>
        <p className="text-[length:var(--font-size-body)] font-bold text-ink">{title}</p>
        {description ? (
          <p className="mt-1 text-[length:var(--font-size-sub)] text-muted">{description}</p>
        ) : null}
      </div>
      <Button variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
