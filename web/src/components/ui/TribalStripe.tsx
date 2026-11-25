import { useId } from 'react';
import { cx } from '../../lib/cx';

export interface TribalStripeProps {
  className?: string;
}

/**
 * 6px geometric highland brocade pattern (clay, turmeric, forest, cream).
 * Restricted strictly to AppHeader top edge, Login screen, and Footer.
 */
export function TribalStripe({ className }: TribalStripeProps) {
  const patternId = useId();

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cx('block h-[6px] w-full shrink-0 select-none', className)}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={patternId}
          width="48"
          height="6"
          patternUnits="userSpaceOnUse"
          shapeRendering="crispEdges"
        >
          <rect width="48" height="6" fill="#163F33" />
          {/* Clay square with warm cream center bead */}
          <rect x="0" y="0" width="8" height="6" fill="#B8431E" />
          <rect x="3" y="2" width="2" height="2" fill="#FAF6EE" />
          {/* Turmeric diamond */}
          <polygon points="16,0 20,3 16,6 12,3" fill="#E3B23C" />
          {/* Cream woven block */}
          <rect x="24" y="0" width="8" height="6" fill="#FAF6EE" />
          <rect x="27" y="2" width="2" height="2" fill="#163F33" />
          {/* Clay diamond with turmeric center */}
          <polygon points="40,0 44,3 40,6 36,3" fill="#B8431E" />
          <rect x="39" y="2" width="2" height="2" fill="#E3B23C" />
        </pattern>
      </defs>
      <rect width="100%" height="6" fill={`url(#${patternId})`} />
    </svg>
  );
}
