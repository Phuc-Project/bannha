import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SyncBadge, formatSyncLabel } from './SyncBadge';

describe('SyncBadge', () => {
  it('formats exact Vietnamese sync copy required by spec §3.6', () => {
    expect(formatSyncLabel({ status: 'synced', minutesAgo: 2 })).toBe('Đã đồng bộ 2 phút trước');
    expect(formatSyncLabel({ status: 'synced', minutesAgo: 0 })).toBe('Vừa đồng bộ xong');
    expect(formatSyncLabel({ status: 'syncing' })).toBe('Đang đồng bộ…');
    expect(formatSyncLabel({ status: 'pending', pendingCount: 3 })).toBe('Đang chờ gửi 3 mục');
    expect(formatSyncLabel({ status: 'offline' })).toBe('Đang ngoại tuyến');
    expect(formatSyncLabel({ status: 'error', pendingCount: 1 })).toBe('Chưa gửi được 1 mục');
  });

  it('renders explicit text alongside visual dot and triggers onRetry when in error state', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<SyncBadge status="error" pendingCount={2} onRetry={onRetry} />);

    expect(screen.getByText('Chưa gửi được 2 mục')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Thử lại/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
