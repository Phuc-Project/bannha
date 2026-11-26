import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type CardVariant = 'default' | 'featured' | 'forest';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'md' | 'none';
  children: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'border-line bg-surface text-ink',
  featured: 'border-turmeric/80 border-l-[3px] border-l-turmeric bg-turmeric-50 text-ink',
  forest: 'border-forest-900 bg-forest-900 text-surface',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        'rounded-[8px] border',
        VARIANT_CLASSES[variant],
        padding === 'md' && 'p-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
