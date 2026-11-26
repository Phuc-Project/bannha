import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TextSizeProvider } from '../../app/providers/TextSizeProvider';
import { ToastProvider } from '../../app/providers/ToastProvider';
import StyleguidePage from './StyleguidePage';

function renderStyleguide() {
  return render(
    <MemoryRouter
      initialEntries={['/dev/ui']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <TextSizeProvider role="student">
        <ToastProvider>
          <StyleguidePage />
        </ToastProvider>
      </TextSizeProvider>
    </MemoryRouter>,
  );
}

describe('StyleguidePage (/dev/ui)', () => {
  it('renders Desktop TOC rail, 3 featured (★) cards, sync switcher, and all 5 role screen previews', async () => {
    const user = userEvent.setup();
    renderStyleguide();

    expect(
      screen.getAllByRole('heading', { name: /Hệ thống giao diện BẢN NHÀ/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Mục lục Styleguide')).toBeInTheDocument();

    expect(screen.getAllByText('★ Sổ liên lạc Bản – Trường').length).toBeGreaterThan(0);
    expect(screen.getAllByText('★ Gia sư AI buổi tối').length).toBeGreaterThan(0);
    expect(screen.getAllByText('★ Kho văn hóa Bản tôi').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Giả lập: Ngoại tuyến' }));
    expect(screen.getAllByText('Đang ngoại tuyến').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Giáo viên' }));
    expect(screen.getAllByText('Lớp 10A1 — Bảng điểm & Sổ liên lạc').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Học sinh' }));
    expect(screen.getByText('Hôm nay của em')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Phụ huynh' }));
    expect(screen.getByText('Hôm nay của con')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Đăng nhập' }));
    expect(screen.getByText('Dùng được khi mất mạng')).toBeInTheDocument();
  });
});
