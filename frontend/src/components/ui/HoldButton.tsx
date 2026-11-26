import { PhoneCall } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/cx';

export interface HoldButtonProps {
  label?: string;
  holdDurationMs?: number;
  onTrigger: () => void;
  className?: string;
}

const STEP_MS = 50;

/**
 * Emergency SOS button requiring a continuous 2-second press-and-hold
 * to prevent accidental Pocket/Touch activation on student phones (§6.5).
 */
export function HoldButton({
  label = 'Giữ 2 giây gọi SOS khẩn cấp',
  holdDurationMs = 2000,
  onTrigger,
  className,
}: HoldButtonProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const holdingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    holdingRef.current = false;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelHold = useCallback(() => {
    clearTimers();
    setElapsedMs(0);
  }, [clearTimers]);

  const startHold = useCallback(() => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    setElapsedMs(STEP_MS);

    intervalRef.current = window.setInterval(() => {
      setElapsedMs((prev) => Math.min(holdDurationMs, prev + STEP_MS));
    }, STEP_MS);

    timerRef.current = window.setTimeout(() => {
      clearTimers();
      setElapsedMs(0);
      onTrigger();
    }, holdDurationMs);
  }, [clearTimers, holdDurationMs, onTrigger]);

  useEffect(() => clearTimers, [clearTimers]);

  const progressPct = Math.min(100, Math.round((elapsedMs / holdDurationMs) * 100));
  const secondsLeft = ((holdDurationMs - elapsedMs) / 1000).toFixed(1);

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        startHold();
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onBlur={cancelHold}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          cancelHold();
        }
      }}
      className={cx(
        'relative inline-flex min-h-[var(--control-height)] w-full select-none items-center justify-center overflow-hidden rounded-control border border-danger bg-danger px-4 py-2.5 text-[length:var(--font-size-body)] font-bold text-surface transition-opacity duration-150',
        className,
      )}
    >
      <span
        aria-hidden="true"
        style={{ width: `${progressPct}%` }}
        className="pointer-events-none absolute inset-y-0 left-0 bg-forest-900/40"
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        <PhoneCall size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>{elapsedMs > 0 ? `Đang giữ… còn ${secondsLeft}s` : label}</span>
      </span>
    </button>
  );
}
