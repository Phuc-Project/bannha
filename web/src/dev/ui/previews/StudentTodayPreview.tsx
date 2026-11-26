import { Award, Bell, BookOpen, CalendarClock, HeartPulse, Home, Utensils } from 'lucide-react';
import { useToast } from '../../../app/providers/toast';
import { AppShell, type NavItem } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { HoldButton } from '../../../components/ui/HoldButton';
import { IconTile } from '../../../components/ui/IconTile';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import type { RolePreviewProps } from './TeacherDeskPreview';

const STUDENT_NAV: NavItem[] = [
  { id: 'today', label: 'Hôm nay', icon: Home, path: '/student' },
  { id: 'dorm', label: 'Ký túc xá', icon: CalendarClock, path: '/student/dorm' },
  { id: 'kitchen', label: 'Bếp ăn', icon: Utensils, path: '/student/kitchen' },
  { id: 'tutor', label: 'Gia sư', icon: BookOpen, path: '/student/tutor' },
  { id: 'health', label: 'Y tế', icon: HeartPulse, path: '/student/health' },
];

export function StudentTodayPreview({ syncState, forceViewport = 'responsive' }: RolePreviewProps) {
  const { showToast } = useToast();
  const isMobile = forceViewport === 'mobile';

  return (
    <AppShell
      embedded
      forceViewport={forceViewport}
      role="student"
      title="Hôm nay của em"
      subtitle="Giàng A Páo · Lớp 10A1 · Phòng A204"
      syncState={syncState}
      navItems={STUDENT_NAV}
      activePath="/student"
    >
      <div
        className={isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-5 lg:grid-cols-12'}
      >
        <div className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-3.5 lg:col-span-7'}>
          <SectionTitle title="Việc cần làm tối nay" subtitle="Thứ Năm · Ký túc xá Dãy A" />

          <Card className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <IconTile icon={CalendarClock} />
                <div>
                  <p className="font-bold text-ink">Điểm danh tự học tối (19:30 – 21:30)</p>
                  <p className="text-[length:var(--font-size-sub)] text-muted">
                    Phòng học 10A1 · Mở thẻ QR để Quản sinh quét nhanh
                  </p>
                </div>
              </div>
              <StatusBadge tone="forest" label="Còn 20 phút" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => showToast('Đã hiển thị thẻ QR của Giàng A Páo')}
              >
                Mở thẻ QR cá nhân
              </Button>
              <Button variant="secondary" onClick={() => showToast('Mở mẫu tạo đơn xin về bản')}>
                Xin phép về cuối tuần
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-ink">Bữa tối nay tại nhà bếp (17:30)</p>
              <StatusBadge tone="success" label="Đã đăng ký suất" />
            </div>
            <p className="text-[length:var(--font-size-body)] text-ink">
              Cơm trắng · Thịt kho củ cải · Đậu phụ sốt cà chua · Canh rau cải xanh
            </p>
            <div>
              <Button
                variant="tonal"
                onClick={() => showToast('Đã mở mục báo cắt suất trước 15:00 ngày mai')}
              >
                Báo cắt suất ngày mai
              </Button>
            </div>
          </Card>
        </div>

        <div className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-3.5 lg:col-span-5'}>
          <SectionTitle title="Tiện ích nổi bật" />
          <Card variant="featured" className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <IconTile icon={BookOpen} featured size="sm" />
              <p className="font-bold text-ink">★ Gia sư AI buổi tối</p>
            </div>
            <p className="text-[length:var(--font-size-sub)] text-muted">
              Ôn tập chủ đề tuần 12 môn Toán: Hàm số bậc hai (còn 28/30 câu hôm nay).
            </p>
          </Card>

          <Card variant="featured" className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <IconTile icon={Bell} featured size="sm" />
              <p className="font-bold text-ink">★ Sổ liên lạc Bản – Trường</p>
            </div>
            <p className="text-[length:var(--font-size-sub)] text-muted">
              Cô Bùi Thị Hoa vừa nhập điểm 15 phút môn Vật lý (8,5).
            </p>
          </Card>

          <Card variant="featured" className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <IconTile icon={Award} featured size="sm" />
              <p className="font-bold text-ink">★ Kho văn hóa Bản tôi</p>
            </div>
            <p className="text-[length:var(--font-size-sub)] text-muted">
              5 bài mới về tiếng khèn Mông, lễ cấp sắc người Dao và xôi ngũ sắc Tày.
            </p>
          </Card>

          <HoldButton
            onTrigger={() => showToast('Đã gửi SOS khẩn cấp kèm vị trí Phòng A204!', 'danger')}
          />
        </div>
      </div>
    </AppShell>
  );
}
