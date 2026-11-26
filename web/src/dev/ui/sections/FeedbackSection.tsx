import { Bell, BookOpen, Compass, FileText, Home, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../app/providers/toast';
import { Banner } from '../../../components/ui/Banner';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Dialog } from '../../../components/ui/Dialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { IconTile } from '../../../components/ui/IconTile';
import { ListRow } from '../../../components/ui/ListRow';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { Sheet } from '../../../components/ui/Sheet';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SyncBadge } from '../../../components/ui/SyncBadge';
import { Timeline } from '../../../components/ui/Timeline';
import { SAMPLE_GRADES } from '../sampleData';

export function FeedbackSection() {
  const { showToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle
        title="4. Card chức năng nổi bật (★), Trạng thái đồng bộ & Hộp thoại"
        subtitle="Phân tách bằng viền 1px --color-line; chỉ Bottom Sheet và Dialog có đổ bóng nhẹ"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-2.5">
          <IconTile icon={Home} />
          <p className="font-bold text-ink">Ký túc xá số</p>
          <p className="text-[length:var(--font-size-sub)] text-muted">
            Điểm danh bằng mã QR ngoại tuyến, xin phép về bản, báo hỏng đồ phòng ở.
          </p>
        </Card>

        <Card variant="featured" className="flex flex-col gap-2.5">
          <IconTile icon={Bell} featured />
          <p className="font-bold text-ink">★ Sổ liên lạc Bản – Trường</p>
          <p className="text-[length:var(--font-size-sub)] text-muted">
            Phụ huynh xem điểm danh, kết quả học tập, lịch về nhà và thông báo từ Thầy/Cô.
          </p>
        </Card>

        <Card variant="featured" className="flex flex-col gap-2.5">
          <IconTile icon={BookOpen} featured />
          <p className="font-bold text-ink">★ Gia sư AI buổi tối</p>
          <p className="text-[length:var(--font-size-sub)] text-muted">
            Hỏi bài giờ tự học theo phương pháp gợi mở từng bước, ôn đúng chủ đề trên lớp.
          </p>
        </Card>

        <Card variant="featured" className="flex flex-col gap-2.5">
          <IconTile icon={Compass} featured />
          <p className="font-bold text-ink">★ Kho văn hóa Bản tôi</p>
          <p className="text-[length:var(--font-size-sub)] text-muted">
            Học sinh giới thiệu trang phục, lễ hội, món ăn, lời chào của dân tộc mình.
          </p>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="font-bold text-ink">Chỉ báo đồng bộ (chấm màu + chữ rõ ràng)</p>
        <div className="flex flex-wrap gap-2">
          <SyncBadge status="synced" minutesAgo={2} />
          <SyncBadge status="syncing" />
          <SyncBadge status="pending" pendingCount={3} />
          <SyncBadge status="offline" />
          <SyncBadge
            status="error"
            pendingCount={1}
            onRetry={() => showToast('Đang thử gửi lại 1 mục trong hàng đợi…')}
          />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <StatusBadge tone="success" label="Có mặt đúng giờ" />
          <StatusBadge tone="warning" label="Đang chờ duyệt" />
          <StatusBadge tone="forest" label="Tự động – đơn về nhà" />
          <StatusBadge tone="danger" label="Vắng chưa rõ lý do" />
        </div>
      </Card>

      <Banner
        tone="offline"
        title="Chưa gửi được vì mất sóng."
        description="Đơn đã lưu, sẽ tự gửi khi có mạng."
        actionLabel="Xem hàng đợi (3)"
        onAction={() => setSheetOpen(true)}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <p className="font-bold text-ink">Kết quả học tập học kỳ I (thanh ngang CSS thuần)</p>
          {SAMPLE_GRADES.map((g) => (
            <ProgressBar key={g.subject} label={g.subject} value={g.score} valueText={g.text} />
          ))}
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="font-bold text-ink">Tiến trình duyệt đơn xin về cuối tuần</p>
          <Timeline
            items={[
              {
                id: 's1',
                title: 'Em gửi đơn xin về bản',
                time: 'Thứ Năm · 14:20',
                note: 'Từ 17:00 Thứ Bảy đến 17:30 Chủ Nhật',
                tone: 'done',
              },
              {
                id: 's2',
                title: 'GVCN Cô Bùi Thị Hoa đã xác nhận',
                time: 'Thứ Năm · 15:05',
                tone: 'done',
              },
              {
                id: 's3',
                title: 'Tự động cắt 3 bữa ăn tại nhà bếp',
                time: 'Tự động khi đơn được duyệt',
                tone: 'current',
              },
            ]}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <EmptyState
          icon={FileText}
          title="Chưa có đơn nào."
          description="Khi cần xin về bản hoặc báo nghỉ ốm, em tạo đơn trực tiếp ngay cả khi mất mạng."
          actionLabel="Tạo đơn xin phép"
          onAction={() => showToast('Mở biểu mẫu tạo đơn xin phép')}
        />

        <Card padding="none" className="divide-y divide-line overflow-hidden">
          <ListRow
            leading={<IconTile icon={Sparkles} size="sm" />}
            title="Học bổng Vừ A Dính năm học 2026–2027"
            subtitle="Dành cho học sinh DTTS · Còn 12 ngày nộp hồ sơ"
            trailing={<StatusBadge tone="forest" label="Còn hạn" />}
            onClick={() => setSheetOpen(true)}
          />
          <div className="flex flex-wrap gap-2 p-4">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Mở hộp thoại xác nhận
            </Button>
            <Button variant="tonal" onClick={() => setSheetOpen(true)}>
              Mở bảng trượt đáy (Bottom Sheet)
            </Button>
          </div>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Xác nhận báo cắt suất ăn"
        description="Báo trước 15:00 để nhà bếp điều chỉnh lượng thực phẩm nấu."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Giữ lại suất
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDialogOpen(false);
                showToast('Đã báo cắt suất bữa trưa Chủ Nhật', 'success');
              }}
            >
              Xác nhận cắt suất
            </Button>
          </>
        }
      >
        <p className="text-[length:var(--font-size-body)] text-ink">
          Em xác nhận báo cắt <strong>Bữa trưa Chủ Nhật</strong> cho học sinh{' '}
          <strong>Giàng A Páo (10A1)</strong>?
        </p>
      </Dialog>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Mục đang chờ đồng bộ (3)"
        description="Các thao tác đã lưu an toàn trên máy, sẽ tự đẩy lên trường khi có sóng."
        footer={
          <Button variant="primary" onClick={() => setSheetOpen(false)}>
            Đã hiểu
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          <Card>1. Đơn xin về cuối tuần · Đang chờ gửi</Card>
          <Card>2. Báo cắt suất chiều Thứ Bảy · Đang chờ gửi</Card>
          <Card>3. Câu hỏi Toán học cho Gia sư buổi tối · Đang chờ gửi</Card>
        </div>
      </Sheet>
    </section>
  );
}
