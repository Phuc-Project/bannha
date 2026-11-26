import { Check, ClipboardCheck, DoorOpen, PackageOpen, QrCode, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../app/providers/toast';
import { AppShell, type NavItem } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DataTable, type DataColumn } from '../../../components/ui/DataTable';
import { ListRow } from '../../../components/ui/ListRow';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SCHOOL_INFO } from '../sampleData';
import type { RolePreviewProps } from './TeacherDeskPreview';

interface PendingLeave {
  id: string;
  student: string;
  classRoom: string;
  period: string;
  mealsCut: string;
  approved: boolean;
}

const INITIAL_LEAVES: PendingLeave[] = [
  {
    id: 'l1',
    student: 'Giàng A Páo',
    classRoom: '10A1 · Phòng A204',
    period: '16:30 Thứ Sáu → 17:00 Chủ Nhật',
    mealsCut: '4 bữa tự động',
    approved: false,
  },
  {
    id: 'l2',
    student: 'Triệu Văn Phú',
    classRoom: '11A2 · Phòng B102',
    period: '17:00 Thứ Bảy → 17:00 Chủ Nhật',
    mealsCut: '3 bữa tự động',
    approved: false,
  },
];

export function StaffDeskPreview({ syncState, forceViewport = 'responsive' }: RolePreviewProps) {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState<PendingLeave[]>(INITIAL_LEAVES);
  const isMobile = forceViewport === 'mobile';
  const pendingCount = leaves.filter((item) => !item.approved).length;

  const staffNav: NavItem[] = [
    { id: 'attendance', label: 'Điểm danh', icon: QrCode, path: '/staff' },
    {
      id: 'leaves',
      label: 'Đơn phép',
      icon: ClipboardCheck,
      path: '/staff/leaves',
      badgeCount: pendingCount,
    },
    { id: 'rooms', label: 'Phòng ở', icon: DoorOpen, path: '/staff/rooms', badgeCount: 2 },
    { id: 'donations', label: 'Đồ cũ', icon: PackageOpen, path: '/staff/donations' },
    { id: 'sos', label: 'Trực SOS', icon: ShieldAlert, path: '/staff/sos' },
  ];

  const approveLeave = (id: string, student: string) => {
    setLeaves((prev) => prev.map((row) => (row.id === id ? { ...row, approved: true } : row)));
    showToast(`Đã duyệt đơn của ${student} và tự động báo cắt suất nhà bếp`, 'success');
  };

  const leaveColumns: DataColumn<PendingLeave>[] = [
    {
      key: 'student',
      header: 'Học sinh & Phòng',
      render: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.student}</p>
          <p className="text-[length:var(--font-size-sub)] text-muted">{row.classRoom}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Thời gian về bản',
      render: (row) => <span>{row.period}</span>,
    },
    {
      key: 'meals',
      header: 'Bếp ăn',
      render: (row) => <StatusBadge tone="forest" label={row.mealsCut} />,
    },
    {
      key: 'action',
      header: 'Xử lý',
      align: 'right',
      render: (row) =>
        row.approved ? (
          <StatusBadge tone="success" label="Đã duyệt" />
        ) : (
          <Button variant="primary" icon={Check} onClick={() => approveLeave(row.id, row.student)}>
            Duyệt đơn
          </Button>
        ),
    },
  ];

  return (
    <AppShell
      embedded
      forceViewport={forceViewport}
      role="dorm_staff"
      title="Ca trực Ký túc xá"
      subtitle="Quản sinh Nông Văn Toàn · Dãy A & Dãy B"
      schoolName={SCHOOL_INFO.name}
      sidebarFooter={`Trực KTX: ${SCHOOL_INFO.dormHotlineDisplay}`}
      syncState={syncState}
      navItems={staffNav}
      activePath="/staff"
    >
      <div className="flex flex-col gap-5">
        <Card
          variant="forest"
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-[length:var(--font-size-sub)] font-semibold text-turmeric">
              Phiên kiểm tra phòng tối · Quét QR hoàn toàn ngoại tuyến
            </p>
            <p className="mt-1 text-xl font-bold text-surface">
              Đã điểm danh 12 / 14 học sinh · 1 có phép · 1 chưa quét
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={QrCode}
              onClick={() => showToast('Đã mở camera quét thẻ QR học sinh offline')}
            >
              Quét tiếp thẻ QR
            </Button>
          </div>
        </Card>

        <div
          className={isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-5 xl:grid-cols-12'}
        >
          <div className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-3 xl:col-span-8'}>
            <SectionTitle
              title={`Đơn xin về bản chờ duyệt (${pendingCount})`}
              subtitle="Duyệt 1 chạm — hệ thống tự tạo phiếu cắt suất ăn theo ngày về"
            />
            <DataTable
              caption="Danh sách đơn xin phép chờ Quản sinh duyệt"
              columns={leaveColumns}
              rows={leaves}
              getRowKey={(row) => row.id}
              forceMobile={isMobile}
            />
          </div>

          <div className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-4 xl:col-span-4'}>
            <SectionTitle title="Cần kiểm tra trong ca trực" />
            <Card padding="none" className="divide-y divide-line overflow-hidden">
              <ListRow
                title="Lò Văn Pắn · Phòng A103"
                subtitle="Chưa quét QR phiên tối · Không có đơn nghỉ"
                trailing={<StatusBadge tone="danger" label="Kiểm tra ngay" />}
              />
              <ListRow
                title="Hoàng Thị Lan · Phòng A202"
                subtitle="Báo hỏng bóng đèn bàn học · Kèm ảnh chụp"
                trailing={<StatusBadge tone="warning" label="Mới báo" />}
              />
              <ListRow
                title="Phòng B103 · Cửa sổ lỏng chốt"
                subtitle="Đang hẹn thợ mộc sửa sáng Thứ Sáu"
                trailing={<StatusBadge tone="forest" label="Đang xử lý" />}
              />
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
