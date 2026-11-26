import { useId } from 'react';
import { cx } from '../../lib/cx';

export interface TribalStripeProps {
  className?: string;
}

/**
 * 6px geometric highland brocade band.
 * Restricted to top of AppHeader, Login screen, and Footer per spec §3.3.
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
          {/* Clay square with cream core */}
          <rect x="2" y="0" width="6" height="6" fill="#B8431E" />
          <rect x="4" y="2" width="2" height="2" fill="#FAF6EE" />
          {/* Turmeric stepped diamond */}
          <polygon points="16,0 19,3 16,6 13,3" fill="#E3B23C" />
          {/* Cream square bead flanked by clay ticks */}
          <rect x="24" y="2" width="1" height="2" fill="#B8431E" />
          <rect x="26" y="1" width="4" height="4" fill="#FAF6EE" />
          <rect x="31" y="2" width="1" height="2" fill="#B8431E" />
          {/* Clay diamond with turmeric center */}
          <polygon points="40,0 43,3 40,6 37,3" fill="#B8431E" />
          <rect x="39" y="2" width="2" height="2" fill="#E3B23C" />
        </pattern>
      </defs>
      <rect width="100%" height="6" fill={`url(#${patternId})`} />
    </svg>
  );
}
