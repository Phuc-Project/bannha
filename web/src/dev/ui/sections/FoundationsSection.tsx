import { Card } from '../../../components/ui/Card';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { TribalStripe } from '../../../components/ui/TribalStripe';
import { contrastRatio } from '../../../lib/contrast';
import { TOKENS } from '../../../styles/palette';

const SWATCHES: ReadonlyArray<{
  name: string;
  cssVar: keyof typeof TOKENS;
  usage: string;
  sampleFg: string;
}> = [
  {
    name: 'Forest 900',
    cssVar: '--color-forest-900',
    usage: 'Header, khối tối',
    sampleFg: '#FFFFFF',
  },
  {
    name: 'Forest 700',
    cssVar: '--color-forest-700',
    usage: 'Nút chính, trạng thái chọn',
    sampleFg: '#FFFFFF',
  },
  {
    name: 'Forest 50',
    cssVar: '--color-forest-50',
    usage: 'Nền ô icon, chip',
    sampleFg: '#1E5A47',
  },
  { name: 'Cream', cssVar: '--color-cream', usage: 'Nền toàn ứng dụng', sampleFg: '#1C2B25' },
  {
    name: 'Surface',
    cssVar: '--color-surface',
    usage: 'Nền card, input, bảng',
    sampleFg: '#1C2B25',
  },
  { name: 'Line', cssVar: '--color-line', usage: 'Viền phân tách 1px', sampleFg: '#1C2B25' },
  {
    name: 'Clay 600',
    cssVar: '--color-clay-600',
    usage: 'Tiêu đề section 20px, icon ★',
    sampleFg: '#FFFFFF',
  },
  {
    name: 'Turmeric',
    cssVar: '--color-turmeric',
    usage: 'Viền card ★, điểm nhấn trên nền tối',
    sampleFg: '#1C2B25',
  },
  {
    name: 'Turmeric 50',
    cssVar: '--color-turmeric-50',
    usage: 'Nền card chức năng ★',
    sampleFg: '#1C2B25',
  },
  { name: 'Ink', cssVar: '--color-ink', usage: 'Chữ nội dung chính', sampleFg: '#FAF6EE' },
  { name: 'Muted', cssVar: '--color-muted', usage: 'Chữ phụ, thời gian', sampleFg: '#FFFFFF' },
  { name: 'Danger', cssVar: '--color-danger', usage: 'SOS khẩn cấp, báo lỗi', sampleFg: '#FFFFFF' },
  {
    name: 'Success',
    cssVar: '--color-success',
    usage: 'Đã đồng bộ, đã duyệt',
    sampleFg: '#FFFFFF',
  },
];

export function FoundationsSection() {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle
        title="1. Bảng màu, kiểu chữ & dải thổ cẩm"
        subtitle="13 token màu vùng cao kiểm định tự động độ tương phản WCAG AA (≥ 4,5:1)"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SWATCHES.map((item) => {
          const bgHex = TOKENS[item.cssVar];
          const ratio = contrastRatio(item.sampleFg, bgHex);
          return (
            <Card key={item.cssVar} padding="none" className="overflow-hidden">
              <div
                style={{ backgroundColor: bgHex, color: item.sampleFg }}
                className="flex items-center justify-between px-4 py-3 font-semibold"
              >
                <span>{item.name}</span>
                <span className="text-[length:var(--font-size-sub)]">{bgHex}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13px] text-ink">{item.cssVar}</p>
                  <p className="text-[length:var(--font-size-sub)] text-muted">{item.usage}</p>
                </div>
                <StatusBadge tone="forest" label={`${ratio}:1`} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-col gap-3">
        <p className="font-bold text-ink">Dải thổ cẩm hình học 6px (TribalStripe)</p>
        <p className="text-[length:var(--font-size-sub)] text-muted">
          Tự vẽ bằng SVG pattern (ô vuông đỏ đất lồng hạt kem, hình thoi vàng nghệ trên nền xanh
          rừng). Chỉ đặt ở mép trên Header, màn Đăng nhập và Footer.
        </p>
        <div className="overflow-hidden rounded-control border border-line">
          <TribalStripe />
        </div>
      </Card>
    </section>
  );
}
