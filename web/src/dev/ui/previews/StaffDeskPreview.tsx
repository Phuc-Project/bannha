import { Check, ClipboardCheck, DoorOpen, PackageOpen, QrCode, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../app/providers/toast';
import { AppShell, type NavItem } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/Button';
import { DataTable, type DataColumn } from '../../../components/ui/DataTable';
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
    classRoom: '10A1 · A204',
    period: '16:30 T6 → 17:00 CN',
    mealsCut: 'Cắt 4 bữa',
    approved: false,
  },
  {
    id: 'l2',
    student: 'Triệu Văn Phú',
    classRoom: '11A2 · B102',
    period: '17:00 T7 → 17:00 CN',
    mealsCut: 'Cắt 3 bữa',
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

  const leaveColumns: DataColumn<PendingLeave>[] = [
    {
      key: 'student',
      header: 'Học sinh',
      render: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.student}</p>
          <p className="text-[12px] text-muted">{row.classRoom}</p>
        </div>
      ),
    },
    { key: 'period', header: 'Thời gian', render: (row) => row.period },
    {
      key: 'meals',
      header: 'Bếp ăn',
      render: (row) => <span className="text-muted">{row.mealsCut}</span>,
    },
    {
      key: 'action',
      header: 'Xử lý',
      align: 'right',
      render: (row) =>
        row.approved ? (
          <StatusBadge tone="success" label="Đã duyệt" />
        ) : (
          <Button
            size="sm"
            variant="primary"
            icon={Check}
            onClick={() => {
              setLeaves((prev) =>
                prev.map((item) => (item.id === row.id ? { ...item, approved: true } : item)),
              );
              showToast(`Đã duyệt đơn của ${row.student} và báo cắt suất bếp`, 'success');
            }}
          >
            Duyệt
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
      headerAction={
        <Button
          size="sm"
          variant="primary"
          icon={QrCode}
          onClick={() => showToast('Đã mở camera quét thẻ QR học sinh offline')}
        >
          Quét thẻ QR
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface md:grid-cols-4 md:divide-x md:divide-y-0">
          <div className="px-4 py-2.5">
            <p className="text-[12px] text-muted">Đã quét QR tối</p>
            <p className="text-[18px] font-bold tabular-nums text-ink">12 / 14</p>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-[12px] text-muted">Nghỉ có phép</p>
            <p className="text-[18px] font-bold tabular-nums text-ink">1 em</p>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-[12px] text-muted">Chưa điểm danh</p>
            <p className="text-[18px] font-bold tabular-nums text-danger">1 em (A103)</p>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-[12px] text-muted">Đơn chờ duyệt</p>
            <p className="text-[18px] font-bold tabular-nums text-ink">{pendingCount} đơn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-2.5 lg:col-span-8">
            <SectionTitle
              title={`Đơn xin về bản chờ duyệt (${pendingCount})`}
              subtitle="Duyệt 1 chạm — tự động tạo phiếu cắt suất ăn theo ngày về"
            />
            <DataTable
              caption="Danh sách đơn xin phép chờ Quản sinh duyệt"
              columns={leaveColumns}
              rows={leaves}
              getRowKey={(row) => row.id}
              forceMobile={isMobile}
            />
          </div>

          <div className="lg:col-span-4">
            <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
              <div className="border-b border-line bg-cream/60 px-4 py-2.5">
                <p className="text-[14px] font-bold text-ink">Sự cố & Kiểm phòng</p>
              </div>
              <ul className="divide-y divide-line text-[13px]">
                <li className="flex items-start justify-between gap-2 px-4 py-2.5">
                  <div>
                    <p className="font-semibold text-ink">Lò Văn Pắn · A103</p>
                    <p className="text-muted">Chưa quét QR phiên tối</p>
                  </div>
                  <StatusBadge tone="danger" label="Kiểm tra" />
                </li>
                <li className="flex items-start justify-between gap-2 px-4 py-2.5">
                  <div>
                    <p className="font-semibold text-ink">Hoàng Thị Lan · A202</p>
                    <p className="text-muted">Hỏng bóng đèn bàn học</p>
                  </div>
                  <StatusBadge tone="warning" label="Mới báo" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
