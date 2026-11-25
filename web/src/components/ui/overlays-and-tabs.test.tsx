import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';
import { ProgressBar } from './ProgressBar';
import { Sheet } from './Sheet';
import { Tabs } from './Tabs';
import { Timeline } from './Timeline';

describe('Overlays, Tabs, Timeline & ProgressBar', () => {
  it('navigates Tabs with ArrowRight, ArrowLeft, Home, and End keys per WAI-ARIA', async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        ariaLabel="Chọn màn hình mẫu"
        items={[
          { id: 't1', label: 'Đăng nhập', content: <p>Nội dung đăng nhập</p> },
          { id: 't2', label: 'Học sinh', content: <p>Nội dung học sinh</p> },
          { id: 't3', label: 'Phụ huynh', content: <p>Nội dung phụ huynh</p> },
        ]}
      />,
    );

    const firstTab = screen.getByRole('tab', { name: 'Đăng nhập' });
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Nội dung đăng nhập')).toBeInTheDocument();

    firstTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Học sinh' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Nội dung học sinh')).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Phụ huynh' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Đăng nhập' })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens Dialog and Sheet with gentle shadow and closes via close button', async () => {
    const user = userEvent.setup();
    const onCloseDialog = vi.fn();
    const onCloseSheet = vi.fn();

    render(
      <div>
        <Dialog open onClose={onCloseDialog} title="Xác nhận báo cắt suất">
          <p>Hủy suất ăn trưa Thứ Bảy (28/11)?</p>
        </Dialog>
        <Sheet open onClose={onCloseSheet} title="Chi tiết đơn xin về">
          <p>Từ 16:30 Thứ Sáu đến 17:00 Chủ Nhật</p>
        </Sheet>
      </div>,
    );

    expect(screen.getByText('Xác nhận báo cắt suất')).toBeInTheDocument();
    expect(screen.getByText('Chi tiết đơn xin về')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đóng hộp thoại' }));
    expect(onCloseDialog).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Đóng ngăn kéo' }));
    expect(onCloseSheet).toHaveBeenCalledTimes(1);
  });

  it('renders ProgressBar with accessible progressbar semantics and Timeline items', () => {
    render(
      <div>
        <ProgressBar label="Toán học" value={8.2} max={10} valueText="8,2 / 10" />
        <Timeline
          items={[
            {
              id: '1',
              title: 'Em gửi đơn xin về bản',
              time: '14:20 hôm nay',
              tone: 'done',
            },
            {
              id: '2',
              title: 'Đang chờ Thầy/Cô chủ nhiệm duyệt',
              time: 'Dự kiến trước 17:00',
              tone: 'current',
            },
          ]}
        />
      </div>,
    );

    const bar = screen.getByRole('progressbar', { name: 'Toán học' });
    expect(bar).toHaveAttribute('aria-valuenow', '8.2');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(screen.getByText('Em gửi đơn xin về bản')).toBeInTheDocument();
  });
});
