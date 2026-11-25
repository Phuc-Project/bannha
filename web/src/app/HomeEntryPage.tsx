import { BookOpen, CalendarClock, HeartPulse, Home, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell, type NavItem } from '../components/layout/AppShell';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { HoldButton } from '../components/ui/HoldButton';
import { IconTile } from '../components/ui/IconTile';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from './providers/toast';

const STUDENT_NAV: NavItem[] = [
  { id: 'today', label: 'Hôm nay', icon: Home, path: '/' },
  { id: 'dorm', label: 'Ký túc xá', icon: CalendarClock, path: '/' },
  { id: 'kitchen', label: 'Bếp ăn', icon: Utensils, path: '/' },
  { id: 'tutor', label: 'Gia sư', icon: BookOpen, path: '/' },
  { id: 'health', label: 'Y tế', icon: HeartPulse, path: '/' },
];

export function HomeEntryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <AppShell
      role="student"
      title="Hôm nay của em"
      subtitle="Giàng A Páo · Lớp 10A1 · Phòng A204"
      syncState={{ status: 'synced', minutesAgo: 2 }}
      navItems={STUDENT_NAV}
      activePath="/"
    >
      <div className="flex flex-col gap-3">
        <Banner
          tone="info"
          title="Môi trường duyệt giao diện Giai đoạn 0"
          description="Mở trang Styleguide để kiểm duyệt toàn bộ design tokens, component và 4 màn hình mẫu theo vai trò."
          actionLabel="Mở trang /dev/ui"
          onAction={() => navigate('/dev/ui')}
        />

        <SectionTitle title="Việc cần làm tối nay" subtitle="Thứ Năm · Ký túc xá Dãy A" />

        <Card className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconTile icon={CalendarClock} />
              <div>
                <p className="font-bold text-ink">Điểm danh tự học buổi tối</p>
                <p className="text-[length:var(--font-size-sub)] text-muted">
                  19:30 – 21:30 · Chuẩn bị thẻ QR học sinh
                </p>
              </div>
            </div>
            <StatusBadge tone="forest" label="Sắp mở phiên" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => showToast('Đã mở thẻ QR cá nhân của em')}>
              Mở thẻ QR của em
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dev/ui')}>
              Xem toàn bộ giao diện
            </Button>
          </div>
        </Card>

        <HoldButton
          onTrigger={() =>
            showToast('Đã phát tín hiệu SOS tới Quản sinh và Y tế trường', 'danger')
          }
        />
      </div>
    </AppShell>
  );
}
