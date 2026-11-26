import { LogIn } from 'lucide-react';
import { useToast } from '../../../app/providers/toast';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { TribalStripe } from '../../../components/ui/TribalStripe';
import { ONBOARDING_STEPS, SCHOOL_INFO, TECHNICAL_COMMITMENTS } from '../sampleData';

export function LoginPreview() {
  const { showToast } = useToast();

  return (
    <div className="overflow-hidden rounded-card border border-line bg-cream">
      <TribalStripe />
      <div className="bg-forest-900 px-4 py-5 text-surface sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[length:var(--font-size-sub)] text-cream/85">{SCHOOL_INFO.name}</p>
            <h3 className="mt-1 text-2xl font-bold tracking-[-0.01em] text-surface">BẢN NHÀ</h3>
            <p className="mt-1 text-[length:var(--font-size-body)] text-cream/90">
              Xa bản, vẫn có nhà. Một ứng dụng – mọi việc của đời sống nội trú.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 md:max-w-xs md:justify-end">
            {TECHNICAL_COMMITMENTS.map((badge) => (
              <li
                key={badge}
                className="rounded-pill border border-turmeric px-3 py-1 text-[length:var(--font-size-sub)] font-medium text-cream"
              >
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 p-4 md:grid-cols-2 sm:p-6">
        <Card className="flex flex-col gap-3">
          <h4 className="text-[length:var(--font-size-section)] font-bold text-ink">
            Đăng nhập tài khoản trường cấp
          </h4>
          <Field id="preview-user" label="Mã đăng nhập" hint="Ví dụ: hs24001, ph01, gv01" required>
            <Input id="preview-user" defaultValue="hs24001" />
          </Field>
          <Field id="preview-pass" label="Mật khẩu" required>
            <Input
              id="preview-pass"
              type="password"
              defaultValue="BanNha2026"
              allowRevealPassword
            />
          </Field>
          <Button
            variant="primary"
            icon={LogIn}
            fullWidth
            onClick={() => showToast('Đăng nhập mẫu thành công với mã hs24001', 'success')}
          >
            Đăng nhập vào trường
          </Button>
          <p className="text-[length:var(--font-size-sub)] text-muted">
            Quên mật khẩu? Báo Thầy/Cô chủ nhiệm hoặc Quản sinh để đặt lại ngay tại trường.
          </p>
        </Card>

        <Card className="flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[length:var(--font-size-section)] font-bold text-clay-600">
              Cách dùng trong 4 bước
            </h4>
            <ol className="flex flex-col gap-2.5">
              {ONBOARDING_STEPS.map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-forest-900 text-[14px] font-bold text-surface">
                    {item.step}
                  </span>
                  <span className="pt-0.5 text-[length:var(--font-size-body)] text-ink">
                    {item.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="border-t border-line pt-3 text-[length:var(--font-size-sub)] text-muted">
            Trực Quản sinh: {SCHOOL_INFO.dormHotlineDisplay} · Y tế:{' '}
            {SCHOOL_INFO.medicalHotlineDisplay}
          </p>
        </Card>
      </div>
      <TribalStripe />
    </div>
  );
}
