import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Thermometer } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Banner } from './Banner';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { Chip } from './Chip';
import { EmptyState } from './EmptyState';
import { Field } from './Field';
import { Input } from './Input';
import { Select } from './Select';
import { Switch } from './Switch';
import { Textarea } from './Textarea';

describe('Cards, Feedback & Form Controls', () => {
  it('styles featured Card with turmeric-50 background, turmeric border, and zero shadow', () => {
    const { container } = render(<Card variant="featured">★ Sổ liên lạc Bản – Trường</Card>);
    const cardEl = container.firstElementChild;
    expect(cardEl).not.toBeNull();
    expect(cardEl?.className).toContain('bg-turmeric-50');
    expect(cardEl?.className).toContain('border-turmeric');
    expect(cardEl?.className).not.toContain('shadow');
  });

  it('requires actionable verb CTA in EmptyState and invokes callback', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Chưa có đơn nào."
        description="Khi cần về bản cuối tuần hoặc nghỉ ốm, em tạo đơn tại đây."
        actionLabel="Tạo đơn xin phép"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Tạo đơn xin phép' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders offline recovery guidance in Banner', () => {
    render(
      <Banner
        tone="offline"
        title="Chưa gửi được vì mất sóng."
        description="Đơn đã lưu, sẽ tự gửi khi có mạng."
      />,
    );
    expect(screen.getByText('Chưa gửi được vì mất sóng.')).toBeInTheDocument();
    expect(screen.getByText('Đơn đã lưu, sẽ tự gửi khi có mạng.')).toBeInTheDocument();
  });

  it('connects Field label, error alert, and password reveal toggle on Input', async () => {
    const user = userEvent.setup();
    render(
      <Field id="login-pw" label="Mật khẩu" error="Mật khẩu chưa đúng, em kiểm tra lại.">
        <Input
          id="login-pw"
          type="password"
          defaultValue="matkhau123"
          allowRevealPassword
          hasError
        />
      </Field>,
    );

    const input = screen.getByLabelText('Mật khẩu') as HTMLInputElement;
    expect(input.type).toBe('password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu chưa đúng, em kiểm tra lại.');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input.type).toBe('text');
    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(input.type).toBe('password');
  });

  it('supports accessible Chip, Select, Textarea, Checkbox, and Switch interactions', async () => {
    const user = userEvent.setup();
    const onChipToggle = vi.fn();
    const onSwitchChange = vi.fn();

    render(
      <div>
        <Chip icon={Thermometer} selected={false} onClick={onChipToggle}>
          Sốt
        </Chip>
        <Select
          aria-label="Chọn bữa ăn"
          options={[
            { value: 'breakfast', label: 'Bữa sáng' },
            { value: 'dinner', label: 'Bữa tối' },
          ]}
        />
        <Textarea aria-label="Lý do xin phép" rows={3} />
        <Checkbox label="Đã đối chiếu thẻ học sinh" />
        <Switch label="Chế độ Chữ lớn" checked={false} onCheckedChange={onSwitchChange} />
      </div>,
    );

    const chip = screen.getByRole('button', { name: 'Sốt' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await user.click(chip);
    expect(onChipToggle).toHaveBeenCalledTimes(1);

    const sw = screen.getByRole('switch', { name: 'Chế độ Chữ lớn' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await user.click(sw);
    expect(onSwitchChange).toHaveBeenCalledWith(true);
  });
});
