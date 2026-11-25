import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';

export interface IconTileProps {
  icon: LucideIcon;
  featured?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

export function IconTile({ icon: Icon, featured = false, size = 'md', className }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-control border',
        size === 'md' ? 'h-10 w-10' : 'h-8 w-8',
        featured
          ? 'border-turmeric bg-turmeric-50 text-clay-600'
          : 'border-line bg-forest-50 text-forest-700',
        className,
      )}
    >
      <Icon size={size === 'md' ? 20 : 17} strokeWidth={1.75} />
    </span>
  );
}
