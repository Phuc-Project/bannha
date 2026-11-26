import { BookOpen, CalendarClock, Check, LayoutGrid, QrCode } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { DataTable, type DataColumn } from '../components/ui/DataTable';
import { HoldButton } from '../components/ui/HoldButton';
import { IconTile } from '../components/ui/IconTile';
import { ListRow } from '../components/ui/ListRow';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  HOME_NAV_BY_ROLE,
  HOME_ROLE_META,
  INITIAL_HOME_LEAVES,
  type HomeDemoRole,
  type HomeLeaveRow,
} from './home-config';
import { useToast } from './providers/toast';

export function HomeEntryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [role, setRole] = useState<HomeDemoRole>('dorm_staff');
  const [leaves, setLeaves] = useState<HomeLeaveRow[]>(INITIAL_HOME_LEAVES);
  const meta = HOME_ROLE_META[role];

  const columns: DataColumn<HomeLeaveRow>[] = [
    {
      key: 'student',
      header: 'Học sinh & Phòng',
      render: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.student}</p>
          <p className="text-[length:var(--font-size-sub)] text-muted">{row.room}</p>
        </div>
      ),
    },
    { key: 'time', header: 'Thời gian', render: (row) => row.timeRange },
    {
      key: 'meals',
      header: 'Bếp ăn',
      render: (row) => <StatusBadge tone="forest" label={row.meals} />,
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      render: (row) =>
        row.approved ? (
          <StatusBadge tone="success" label="Đã duyệt" />
        ) : (
          <Button
            variant="primary"
            icon={Check}
            onClick={() => {
              setLeaves((prev) =>
                prev.map((item) => (item.id === row.id ? { ...item, approved: true } : item)),
              );
              showToast(`Đã duyệt đơn của ${row.student}`, 'success');
            }}
          >
            Duyệt đơn
          </Button>
        ),
    },
  ];

  return (
    <AppShell
      role={role}
      title={meta.title}
      subtitle={meta.subtitle}
      sidebarFooter={meta.footer}
      syncState={{ status: 'synced', minutesAgo: 2 }}
      navItems={HOME_NAV_BY_ROLE[role]}
      activePath="/"
      headerAction={
        <Button variant="secondary" icon={LayoutGrid} onClick={() => navigate('/dev/ui')}>
          Mở Styleguide /dev/ui
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-ink">Chuyển nhanh góc nhìn Desktop & Mobile (GĐ 0)</p>
            <p className="text-[length:var(--font-size-sub)] text-muted">
              Nhân viên trường tự hiển thị Sidebar trái cố định khi màn hình ≥ 1024px.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip selected={role === 'dorm_staff'} onClick={() => setRole('dorm_staff')}>
              Quản sinh (Desktop)
            </Chip>
            <Chip selected={role === 'teacher'} onClick={() => setRole('teacher')}>
              Giáo viên (Desktop)
            </Chip>
            <Chip selected={role === 'student'} onClick={() => setRole('student')}>
              Học sinh
            </Chip>
            <Chip selected={role === 'parent'} onClick={() => setRole('parent')}>
              Phụ huynh
            </Chip>
          </div>
        </Card>

        {role === 'dorm_staff' || role === 'teacher' ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-8">
              <Card
                variant="forest"
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-[length:var(--font-size-sub)] font-semibold text-turmeric">
                    {role === 'dorm_staff'
                      ? 'Phiên điểm danh tối · Chạy hoàn toàn ngoại tuyến'
                      : 'Lớp chủ nhiệm 10A1 · Sổ liên lạc Bản – Trường'}
                  </p>
                  <p className="mt-1 text-xl font-bold text-surface">
                    {role === 'dorm_staff'
                      ? '12 / 14 học sinh đã quét QR · 1 có phép · 1 chưa quét'
                      : '14 / 14 học sinh có mặt · 11 phụ huynh đã đọc thông báo'}
                  </p>
                </div>
                <Button variant="secondary" icon={QrCode} onClick={() => navigate('/dev/ui')}>
                  Xem đầy đủ trên /dev/ui
                </Button>
              </Card>

              <SectionTitle
                title="Đơn xin về bản chờ duyệt"
                subtitle="Duyệt 1 chạm — tự động cập nhật số suất cần nấu cho nhà bếp"
              />
              <DataTable
                caption="Danh sách đơn xin phép chờ duyệt"
                columns={columns}
                rows={leaves}
                getRowKey={(row) => row.id}
              />
            </div>

            <div className="flex flex-col gap-4 xl:col-span-4">
              <SectionTitle title="Cần xử lý trong ngày" />
              <Card padding="none" className="divide-y divide-line overflow-hidden">
                <ListRow
                  title="Lò Văn Pắn · Phòng A103"
                  subtitle="Chưa quét QR kiểm phòng tối"
                  trailing={<StatusBadge tone="danger" label="Kiểm tra" />}
                />
                <ListRow
                  title="Hoàng Thị Lan · Phòng A202"
                  subtitle="Báo hỏng bóng đèn bàn học"
                  trailing={<StatusBadge tone="warning" label="Mới báo" />}
                />
              </Card>
              <Card variant="featured" className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <IconTile icon={BookOpen} featured size="sm" />
                  <p className="font-bold text-ink">★ Thống kê Gia sư AI tuần 12</p>
                </div>
                <p className="text-[length:var(--font-size-sub)] text-muted">
                  Học sinh hỏi nhiều nhất về Hàm số bậc hai (19 lượt). Nội dung hỏi riêng tư được ẩn
                  hoàn toàn.
                </p>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="flex flex-col gap-3.5 lg:col-span-7">
              <SectionTitle
                title={role === 'parent' ? 'Tình hình hôm nay của con' : 'Việc cần làm tối nay'}
                subtitle="Thứ Năm · Ký túc xá Dãy A"
              />
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
                  <Button variant="primary" onClick={() => showToast('Đã mở thẻ QR cá nhân')}>
                    Mở thẻ QR cá nhân
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/dev/ui')}>
                    Xem trọn bộ Styleguide
                  </Button>
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-3.5 lg:col-span-5">
              <Card variant="featured" className="flex flex-col gap-2">
                <p className="font-bold text-ink">★ Sổ liên lạc Bản – Trường</p>
                <p className="text-[length:var(--font-size-sub)] text-muted">
                  Điểm danh, bảng điểm học kỳ và lịch về bản đồng bộ tự động ngay khi có sóng.
                </p>
              </Card>
              <HoldButton
                onTrigger={() =>
                  showToast('Đã phát tín hiệu SOS tới Quản sinh và Y tế trường', 'danger')
                }
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
