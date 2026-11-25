import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';

export interface IconTileProps {
  icon: LucideIcon;
  featured?: boolean;
  tone?: 'default' | 'danger' | 'clay';
  size?: 'md' | 'sm';
  className?: string;
}

export function IconTile({
  icon: Icon,
  featured = false,
  tone = 'default',
  size = 'md',
  className,
}: IconTileProps) {
  const sizeClass = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 18 : 20;

  let toneClass = 'bg-forest-50 text-forest-700';
  if (featured) {
    toneClass = 'bg-turmeric-50 text-clay-600 border border-turmeric';
  } else if (tone === 'danger') {
    toneClass = 'bg-surface text-danger border border-danger';
  } else if (tone === 'clay') {
    toneClass = 'bg-turmeric-50 text-clay-600';
  }

  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-control',
        sizeClass,
        toneClass,
        className,
      )}
    >
      <Icon size={iconSize} strokeWidth={1.75} />
    </span>
  );
}
