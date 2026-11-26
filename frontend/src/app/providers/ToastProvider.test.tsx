import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast } from './toast';

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast('Đã lưu đơn xin phép vào hàng đợi')}>
      Gửi đơn xin phép
    </button>
  );
}

describe('ToastProvider', () => {
  it('displays action feedback toast and allows dismissing it', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Gửi đơn xin phép' }));
    expect(screen.getByText('Đã lưu đơn xin phép vào hàng đợi')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đóng thông báo' }));
    expect(screen.queryByText('Đã lưu đơn xin phép vào hàng đợi')).not.toBeInTheDocument();
  });
});
