import { Check, FilePlus2, PackageCheck, Phone, Printer, QrCode, Utensils } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../app/providers/toast';
import { Banner } from '../../../components/ui/Banner';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { HoldButton } from '../../../components/ui/HoldButton';
import { IconButton } from '../../../components/ui/IconButton';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { SCHOOL_INFO } from '../sampleData';

export function ActionsSection() {
  const { showToast } = useToast();
  const [sosOfflineTriggered, setSosOfflineTriggered] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle
        title="2. Nút hành động & Nút giữ khẩn cấp SOS (2 giây)"
        subtitle="Nhãn nút luôn là động từ cụ thể; vùng chạm tối thiểu 44×44px (52px ở Chữ lớn)"
      />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            icon={FilePlus2}
            onClick={() => showToast('Đã lưu đơn xin về vào hàng đợi đồng bộ', 'success')}
          >
            Gửi đơn xin về
          </Button>
          <Button
            variant="secondary"
            icon={Utensils}
            onClick={() => showToast('Đã báo cắt suất bữa trưa Thứ Bảy')}
          >
            Báo cắt suất
          </Button>
          <Button
            variant="tonal"
            icon={PackageCheck}
            onClick={() => showToast('Đã xác nhận nhận áo ấm mùa đông', 'success')}
          >
            Đã nhận đồ
          </Button>
          <Button variant="ghost" icon={Check}>
            Đã đọc thông báo
          </Button>
          <Button variant="primary" loading>
            Đang đồng bộ…
          </Button>
          <Button variant="secondary" disabled>
            Đã quá giờ chốt (15:00)
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-line pt-3">
          <span className="text-[length:var(--font-size-sub)] text-muted">
            Nút biểu tượng (có aria-label):
          </span>
          <IconButton
            icon={QrCode}
            aria-label="Mở máy quét thẻ QR"
            onClick={() => showToast('Mở camera quét thẻ QR học sinh')}
          />
          <IconButton
            icon={Printer}
            variant="tonal"
            aria-label="In thẻ QR học sinh khổ A4"
            onClick={() => showToast('Chuẩn bị trang in 8 thẻ QR trên khổ A4')}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="font-bold text-ink">Cơ chế chống bấm nhầm SOS: nhấn giữ liên tục đủ 2 giây</p>
        <p className="text-[length:var(--font-size-sub)] text-muted">
          Khi mất sóng dữ liệu, ứng dụng hiển thị ngay 2 nút gọi điện thoại trực tiếp qua sóng di
          động tới Quản sinh và Phòng Y tế, đồng thời xếp hàng cảnh báo để tự gửi khi có mạng.
        </p>
        <HoldButton
          onTrigger={() => {
            setSosOfflineTriggered(true);
            showToast('Đã kích hoạt SOS khẩn cấp!', 'danger');
          }}
        />
        {sosOfflineTriggered ? (
          <div className="flex flex-col gap-2.5 pt-1">
            <Banner
              tone="danger"
              title="Đang xếp hàng tín hiệu SOS — hãy gọi ngay nếu mất mạng"
              description="Cuộc gọi điện thoại thông thường vẫn kết nối được khi không có sóng 3G/4G."
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={`tel:${SCHOOL_INFO.dormHotline}`}
                className="inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-control border border-danger bg-danger px-4 py-2 font-bold text-surface"
              >
                <Phone size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>Gọi Quản sinh ({SCHOOL_INFO.dormHotlineDisplay})</span>
              </a>
              <a
                href={`tel:${SCHOOL_INFO.medicalHotline}`}
                className="inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-control border border-forest-900 bg-forest-900 px-4 py-2 font-bold text-surface"
              >
                <Phone size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>Gọi Y tế ({SCHOOL_INFO.medicalHotlineDisplay})</span>
              </a>
            </div>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
