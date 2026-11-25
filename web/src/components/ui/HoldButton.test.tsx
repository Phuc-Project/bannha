import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HoldButton } from './HoldButton';

describe('HoldButton (SOS 2-second safety hold)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels without firing when released before 2000ms', () => {
    const onTrigger = vi.fn();
    render(<HoldButton label="Giữ 2 giây gọi SOS" onTrigger={onTrigger} />);
    const btn = screen.getByRole('button', { name: /Giữ 2 giây gọi SOS/i });

    fireEvent.pointerDown(btn);
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    fireEvent.pointerUp(btn);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('cancels immediately on pointerLeave or pointerCancel (accidental touch slip)', () => {
    const onTrigger = vi.fn();
    render(<HoldButton label="Giữ 2 giây gọi SOS" onTrigger={onTrigger} />);
    const btn = screen.getByRole('button', { name: /Giữ 2 giây gọi SOS/i });

    fireEvent.pointerDown(btn);
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    fireEvent.pointerCancel(btn);
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('fires onTrigger exactly once after continuous 2000ms hold and ignores keyboard repeat events', () => {
    const onTrigger = vi.fn();
    render(<HoldButton label="Giữ 2 giây gọi SOS" onTrigger={onTrigger} />);
    const btn = screen.getByRole('button', { name: /Giữ 2 giây gọi SOS/i });

    fireEvent.keyDown(btn, { key: ' ' });
    fireEvent.keyDown(btn, { key: ' ', repeat: true });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.keyUp(btn, { key: ' ' });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
