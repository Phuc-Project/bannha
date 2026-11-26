import { Activity, CloudRain, HeartPulse, Thermometer, Wind } from 'lucide-react';
import { useState } from 'react';
import { useTextSize } from '../../../app/providers/text-size';
import { Card } from '../../../components/ui/Card';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Chip } from '../../../components/ui/Chip';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { Textarea } from '../../../components/ui/Textarea';
import { ETHNIC_GROUPS } from '../sampleData';

const SYMPTOM_OPTIONS = [
  { id: 'fever', label: 'Sốt', icon: Thermometer },
  { id: 'headache', label: 'Đau đầu', icon: Activity },
  { id: 'stomach', label: 'Đau bụng', icon: HeartPulse },
  { id: 'cough', label: 'Ho', icon: Wind },
  { id: 'dizzy', label: 'Chóng mặt', icon: CloudRain },
] as const;

export function FormsSection() {
  const { textSize, setTextSize } = useTextSize();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['fever', 'headache']);
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>('Mông');
  const [confirmedRule, setConfirmedRule] = useState(true);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle
        title="3. Biểu mẫu nhập liệu & Bộ lọc Chip"
        subtitle="Cỡ chữ ô nhập >= 16px chống tự động phóng to lệch màn hình trên điện thoại nhỏ"
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <Field
            id="demo-username"
            label="Mã đăng nhập trường cấp"
            hint="Ví dụ: hs24001, gv01, qs01, ph01"
            required
          >
            <Input id="demo-username" defaultValue="hs24001" autoComplete="off" />
          </Field>

          <Field id="demo-password" label="Mật khẩu" required>
            <Input
              id="demo-password"
              type="password"
              defaultValue="BanNha@2026"
              allowRevealPassword
            />
          </Field>

          <Field
            id="demo-temp-error"
            label="Nhiệt độ cơ thể (°C)"
            error="Nhiệt độ cần nằm trong khoảng 35,0 đến 42,0 °C."
          >
            <Input id="demo-temp-error" defaultValue="45" hasError />
          </Field>
        </Card>

        <Card className="flex flex-col gap-3">
          <Field id="demo-leave-kind" label="Loại đơn xin phép">
            <Select
              id="demo-leave-kind"
              options={[
                { value: 'go_home', label: 'Xin về bản cuối tuần (tự cắt suất ăn)' },
                { value: 'sick', label: 'Xin nghỉ học tại phòng vì ốm' },
                { value: 'other', label: 'Việc gia đình khác' },
              ]}
            />
          </Field>

          <Field id="demo-leave-reason" label="Lý do cụ thể">
            <Textarea
              id="demo-leave-reason"
              defaultValue="Chiều Thứ Bảy bố đón em ở cổng trường về bản Tả Van, chiều Chủ Nhật 17:00 em có mặt tại ký túc xá."
            />
          </Field>

          <Checkbox
            label="Phụ huynh đã nắm lịch đón em về nhà"
            checked={confirmedRule}
            onChange={(e) => setConfirmedRule(e.target.checked)}
          />

          <Switch
            label="Chế độ Chữ lớn (18px · nút 52px)"
            description="Tự động bật mặc định cho tài khoản Phụ huynh ở bản"
            checked={textSize === 'large'}
            onCheckedChange={(checked) => setTextSize(checked ? 'large' : 'normal')}
          />
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="font-bold text-ink">Chọn nhanh triệu chứng khi báo ốm (Y tế học đường)</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((item) => (
            <Chip
              key={item.id}
              icon={item.icon}
              selected={selectedSymptoms.includes(item.id)}
              onClick={() => toggleSymptom(item.id)}
            >
              {item.label}
            </Chip>
          ))}
        </div>

        <div className="border-t border-line pt-3">
          <p className="mb-2 font-bold text-ink">
            Kho văn hóa Bản tôi — Trường mình có {ETHNIC_GROUPS.length} dân tộc
          </p>
          <div className="flex flex-wrap gap-2">
            {ETHNIC_GROUPS.map((group) => (
              <Chip
                key={group}
                selected={selectedEthnicity === group}
                onClick={() => setSelectedEthnicity(group)}
              >
                {group}
              </Chip>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
