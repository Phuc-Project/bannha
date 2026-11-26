import { Bell, CalendarCheck, GraduationCap, HeartPulse, Home } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../app/providers/toast';
import { AppShell, type NavItem } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Chip } from '../../../components/ui/Chip';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SAMPLE_GRADES } from '../sampleData';
import type { RolePreviewProps } from './TeacherDeskPreview';

const PARENT_NAV: NavItem[] = [
  { id: 'today', label: 'Hôm nay', icon: Home, path: '/parent' },
  { id: 'grades', label: 'Điểm học', icon: GraduationCap, path: '/parent/grades' },
  { id: 'leave', label: 'Lịch về', icon: CalendarCheck, path: '/parent/leave' },
  { id: 'notices', label: 'Thông báo', icon: Bell, path: '/parent/notices' },
];

const CHILDREN = [
  {
    id: 'pao',
    label: 'Giàng A Páo · Lớp 10A1',
    attendance: 'Có mặt buổi sáng lúc 06:42 tại Dãy A (quét thẻ QR).',
    health: 'Bình thường, tuần này con không có lượt báo ốm nào.',
    leave: 'Xin về từ 16:30 Thứ Sáu đến 17:00 Chủ Nhật tuần này (Đang chờ duyệt).',
    notice: 'Nhà trường phát áo ấm mùa đông đợt 1 vào sáng Thứ Bảy cho học sinh khối 10.',
  },
  {
    id: 'my',
    label: 'Giàng Thị Mỷ · Lớp 11A2',
    attendance: 'Có mặt đủ buổi sáng và giờ lên lớp · Phòng B103.',
    health: 'Khám định kỳ tháng 11: Cao 156cm, nặng 47kg.',
    leave: 'Cuối tuần này con ở lại trường ôn thi học sinh giỏi.',
    notice: 'Nhắc con mang thêm áo ấm khi nhiệt độ đêm xuống dưới 12°C.',
  },
] as const;

export function ParentTodayPreview({ syncState, forceViewport = 'responsive' }: RolePreviewProps) {
  const { showToast } = useToast();
  const [childIndex, setChildIndex] = useState(0);
  const [markedRead, setMarkedRead] = useState(false);
  const activeChild = CHILDREN[childIndex] ?? CHILDREN[0];
  const isMobile = forceViewport === 'mobile';

  return (
    <div data-text-size="large">
      <AppShell
        embedded
        forceViewport={forceViewport}
        role="parent"
        title="Hôm nay của con"
        subtitle="Phụ huynh Giàng A Súa · Chế độ Chữ lớn (18px)"
        syncState={syncState}
        navItems={PARENT_NAV}
        activePath="/parent"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {CHILDREN.map((child, idx) => (
              <Chip key={child.id} selected={idx === childIndex} onClick={() => setChildIndex(idx)}>
                {child.label}
              </Chip>
            ))}
          </div>

          <div
            className={
              isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-5 lg:grid-cols-12'
            }
          >
            <div
              className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-3.5 lg:col-span-7'}
            >
              <SectionTitle title="Tình hình trong ngày của con" />

              <Card className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-ink">1. Điểm danh hôm nay</p>
                  <StatusBadge tone="success" label="An toàn tại trường" />
                </div>
                <p className="text-ink">{activeChild.attendance}</p>
              </Card>

              <Card className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-ink">2. Sức khỏe nội trú</p>
                  <HeartPulse size={20} strokeWidth={1.75} className="text-success" />
                </div>
                <p className="text-ink">{activeChild.health}</p>
              </Card>

              <Card className="flex flex-col gap-1.5">
                <p className="font-bold text-ink">3. Lịch xin về bản</p>
                <p className="text-ink">{activeChild.leave}</p>
              </Card>
            </div>

            <div
              className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-3.5 lg:col-span-5'}
            >
              <Card variant="featured" className="flex flex-col gap-3">
                <p className="font-bold text-ink">4. Thông báo mới từ Thầy/Cô</p>
                <p className="text-ink">{activeChild.notice}</p>
                <Button
                  variant={markedRead ? 'tonal' : 'primary'}
                  onClick={() => {
                    setMarkedRead(true);
                    showToast('Đã báo lại với GVCN là Phụ huynh đã đọc thông báo', 'success');
                  }}
                >
                  {markedRead ? 'Phụ huynh đã đọc' : 'Xác nhận đã đọc'}
                </Button>
              </Card>

              <Card className="flex flex-col gap-2.5">
                <p className="font-bold text-ink">Tóm tắt học kỳ I</p>
                {SAMPLE_GRADES.slice(0, 3).map((g) => (
                  <ProgressBar
                    key={g.subject}
                    label={g.subject}
                    value={g.score}
                    valueText={g.text}
                  />
                ))}
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
