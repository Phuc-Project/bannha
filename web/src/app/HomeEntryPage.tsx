import { BookOpen, Check, QrCode, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DataTable, type DataColumn } from '../components/ui/DataTable';
import { HoldButton } from '../components/ui/HoldButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { cx } from '../lib/cx';
import {
  EVENING_ATTENDANCE_ROWS,
  HOME_NAV_BY_ROLE,
  HOME_ROLE_META,
  INITIAL_HOME_LEAVES,
  type AttendanceRow,
  type HomeDemoRole,
  type HomeLeaveRow,
} from './home-config';
import { useToast } from './providers/toast';

function MetricStrip({
  items,
}: {
  items: ReadonlyArray<{ label: string; value: string; note: string; alert?: boolean }>;
}) {
  return (
    <div className="grid grid-cols-2 divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface md:grid-cols-4 md:divide-x md:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3">
          <p className="text-[12px] font-medium text-muted">{item.label}</p>
          <p
            className={cx(
              'mt-0.5 text-[20px] font-bold tabular-nums tracking-[-0.01em]',
              item.alert ? 'text-danger' : 'text-ink',
            )}
          >
            {item.value}
          </p>
          <p className="text-[12px] text-muted">{item.note}</p>
        </div>
      ))}
    </div>
  );
}

export function HomeEntryPage() {
  const { showToast } = useToast();
  const [role, setRole] = useState<HomeDemoRole>('dorm_staff');
  const [deskTab, setDeskTab] = useState<'leaves' | 'attendance'>('leaves');
  const [leaves, setLeaves] = useState<HomeLeaveRow[]>(INITIAL_HOME_LEAVES);
  const meta = HOME_ROLE_META[role];
  const pendingCount = leaves.filter((row) => row.status === 'pending').length;

  const updateLeave = (id: string, status: 'approved' | 'rejected', student: string) => {
    setLeaves((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    showToast(
      status === 'approved'
        ? `Đã duyệt đơn của ${student} và tự động báo cắt suất bếp`
        : `Đã từ chối đơn xin về của ${student}`,
      status === 'approved' ? 'success' : 'default',
    );
  };

  const leaveColumns: DataColumn<HomeLeaveRow>[] = [
    {
      key: 'student',
      header: 'Học sinh',
      render: (row) => (
        <div>
          <span className="font-semibold text-ink">{row.student}</span>
          <span className="ml-1.5 text-[12px] text-muted">({row.ethnicity})</span>
        </div>
      ),
    },
    { key: 'room', header: 'Lớp · Phòng', render: (row) => row.room },
    { key: 'time', header: 'Thời gian về', render: (row) => row.timeRange },
    {
      key: 'meals',
      header: 'Bếp ăn',
      render: (row) => <span className="text-muted">{row.meals}</span>,
    },
    {
      key: 'action',
      header: 'Trạng thái',
      align: 'right',
      render: (row) =>
        row.status === 'approved' ? (
          <StatusBadge tone="success" label="Đã duyệt" />
        ) : row.status === 'rejected' ? (
          <StatusBadge tone="neutral" label="Từ chối" />
        ) : (
          <div className="inline-flex items-center gap-1.5">
            <Button
              size="sm"
              variant="primary"
              icon={Check}
              onClick={() => updateLeave(row.id, 'approved', row.student)}
            >
              Duyệt
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={X}
              onClick={() => updateLeave(row.id, 'rejected', row.student)}
            >
              Từ chối
            </Button>
          </div>
        ),
    },
  ];

  const attendanceColumns: DataColumn<AttendanceRow>[] = [
    {
      key: 'student',
      header: 'Học sinh',
      render: (row) => (
        <div>
          <span className="font-semibold text-ink">{row.student}</span>
          <span className="ml-1.5 font-mono text-[12px] text-muted">{row.code}</span>
        </div>
      ),
    },
    { key: 'room', header: 'Lớp · Phòng', render: (row) => row.classRoom },
    { key: 'checkedAt', header: 'Ghi nhận', render: (row) => row.checkedAt },
    {
      key: 'status',
      header: 'Trạng thái',
      align: 'right',
      render: (row) =>
        row.status === 'present' ? (
          <StatusBadge tone="success" label="Có mặt" />
        ) : row.status === 'excused' ? (
          <StatusBadge tone="warning" label="Có phép" />
        ) : (
          <StatusBadge tone="danger" label="Chưa quét" />
        ),
    },
  ];

  const sidebarControl = (
    <div className="flex flex-col gap-2 border-t border-cream/15 pt-2.5">
      <label htmlFor="dev-role-switch" className="text-[11px] text-cream/65">
        Chế độ xem vai trò
      </label>
      <select
        id="dev-role-switch"
        value={role}
        onChange={(e) => setRole(e.target.value as HomeDemoRole)}
        className="h-8 rounded-[6px] border border-cream/25 bg-forest-900 px-2 text-[13px] text-surface focus:border-turmeric"
      >
        <option value="dorm_staff">Quản sinh KTX</option>
        <option value="teacher">Giáo viên chủ nhiệm</option>
        <option value="student">Học sinh nội trú</option>
        <option value="parent">Phụ huynh ở bản</option>
      </select>
      <Link
        to="/dev/ui"
        className="text-[12px] text-cream/75 underline underline-offset-2 hover:text-surface"
      >
        Hệ thống thiết kế (/dev/ui)
      </Link>
    </div>
  );

  return (
    <AppShell
      role={role}
      title={meta.title}
      subtitle={meta.subtitle}
      sidebarFooter={meta.footer}
      sidebarControl={sidebarControl}
      syncState={{ status: 'synced', minutesAgo: 2 }}
      navItems={HOME_NAV_BY_ROLE[role]}
      activePath="/"
      headerAction={
        <Button
          variant="primary"
          icon={QrCode}
          onClick={() => showToast(`Đã mở tác vụ: ${meta.primaryAction}`)}
        >
          {meta.primaryAction}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {role === 'dorm_staff' || role === 'teacher' ? (
          <>
            <MetricStrip
              items={
                role === 'dorm_staff'
                  ? [
                      {
                        label: 'Điểm danh tối',
                        value: '12 / 14',
                        note: 'Phiên quét QR ngoại tuyến',
                      },
                      { label: 'Nghỉ có phép', value: '1 em', note: 'Triệu Văn Phú (Y tế)' },
                      {
                        label: 'Chưa quét QR',
                        value: '1 em',
                        note: 'Lò Văn Pắn · Phòng A103',
                        alert: true,
                      },
                      {
                        label: 'Đơn chờ duyệt',
                        value: `${pendingCount} đơn`,
                        note: 'Tự cắt suất bếp ăn',
                      },
                    ]
                  : [
                      { label: 'Sĩ số lớp 10A1', value: '14 / 14', note: 'Có mặt đầy đủ sáng nay' },
                      { label: 'Trung bình Toán', value: '8,3', note: 'Học kỳ I (tạm tính)' },
                      { label: 'Phụ huynh đã đọc', value: '11 / 14', note: 'Thông báo tuần 12' },
                      { label: 'Gia sư AI hỏi nhiều', value: '19 lượt', note: 'Hàm số bậc hai' },
                    ]
              }
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="flex flex-col gap-3 lg:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                  <div className="flex gap-5">
                    <button
                      type="button"
                      onClick={() => setDeskTab('leaves')}
                      className={cx(
                        'border-b-2 pb-1.5 text-[14px] font-semibold transition-colors',
                        deskTab === 'leaves'
                          ? 'border-clay-600 text-clay-600'
                          : 'border-transparent text-muted hover:text-ink',
                      )}
                    >
                      Đơn xin về bản ({pendingCount} chờ duyệt)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeskTab('attendance')}
                      className={cx(
                        'border-b-2 pb-1.5 text-[14px] font-semibold transition-colors',
                        deskTab === 'attendance'
                          ? 'border-clay-600 text-clay-600'
                          : 'border-transparent text-muted hover:text-ink',
                      )}
                    >
                      Sổ điểm danh phòng tối ({EVENING_ATTENDANCE_ROWS.length})
                    </button>
                  </div>
                </div>

                {deskTab === 'leaves' ? (
                  <DataTable
                    caption="Danh sách đơn xin phép chờ duyệt"
                    columns={leaveColumns}
                    rows={leaves}
                    getRowKey={(row) => row.id}
                  />
                ) : (
                  <DataTable
                    caption="Sổ điểm danh buổi tối"
                    columns={attendanceColumns}
                    rows={EVENING_ATTENDANCE_ROWS}
                    getRowKey={(row) => row.id}
                  />
                )}
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4">
                <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
                  <div className="border-b border-line bg-cream/60 px-4 py-2.5">
                    <h2 className="text-[14px] font-bold text-ink">Sự cố phòng ở & Trực đêm</h2>
                  </div>
                  <ul className="divide-y divide-line text-[14px]">
                    <li className="flex items-start justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-ink">Phòng A103 · Lò Văn Pắn</p>
                        <p className="text-[13px] text-muted">Chưa quét QR phiên tối 19:30</p>
                      </div>
                      <StatusBadge tone="danger" label="Kiểm tra" />
                    </li>
                    <li className="flex items-start justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-ink">Phòng A202 · Hoàng Thị Lan</p>
                        <p className="text-[13px] text-muted">Hỏng bóng đèn bàn học (có ảnh)</p>
                      </div>
                      <StatusBadge tone="warning" label="Mới báo" />
                    </li>
                    <li className="flex items-start justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-ink">Phòng B103 · Dãy nhà B</p>
                        <p className="text-[13px] text-muted">Chốt cửa sổ lỏng · Hẹn sửa T6</p>
                      </div>
                      <StatusBadge tone="neutral" label="Đang xử lý" />
                    </li>
                  </ul>
                </div>

                <Card variant="featured" className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-clay-600">
                    <BookOpen size={16} strokeWidth={1.75} aria-hidden="true" />
                    <p className="text-[14px] font-bold text-ink">★ Thống kê Gia sư AI tuần 12</p>
                  </div>
                  <p className="text-[13px] text-muted">
                    Học sinh hỏi nhiều: <strong>Hàm số bậc hai</strong> (19 lượt),{' '}
                    <strong>Phương trình căn</strong> (11 lượt). Chỉ hiện tổng hợp, ẩn nội dung hỏi
                    riêng.
                  </p>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-8">
              <SectionTitle
                title={role === 'parent' ? 'Tình hình hôm nay của con' : 'Lịch sinh hoạt tối nay'}
                subtitle="Cập nhật tự động từ trường PTDTNT"
              />
              <div className="divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div>
                    <p className="font-semibold text-ink">Điểm danh tự học tối (19:30 – 21:30)</p>
                    <p className="text-[13px] text-muted">
                      Phòng học 10A1 · Mang thẻ QR cá nhân để Quản sinh quét
                    </p>
                  </div>
                  <StatusBadge tone="success" label="Sẵn sàng" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div>
                    <p className="font-semibold text-ink">Bữa tối hôm nay (17:30 · Nhà bếp)</p>
                    <p className="text-[13px] text-muted">
                      Cơm trắng · Thịt kho củ cải · Đậu phụ sốt cà chua · Canh rau cải xanh
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => showToast('Đã mở mục báo cắt suất trước 15:00 ngày mai')}
                  >
                    Báo cắt suất
                  </Button>
                </div>
                <div className="px-4 py-3.5">
                  <p className="mb-2 font-semibold text-ink">Kết quả học kỳ I gần nhất</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ProgressBar label="Toán học" value={8.2} valueText="8,2" />
                    <ProgressBar label="Vật lý" value={8.5} valueText="8,5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 lg:col-span-4">
              <Card variant="featured" className="flex flex-col gap-1.5">
                <p className="font-bold text-ink">★ Sổ liên lạc Bản – Trường</p>
                <p className="text-[13px] text-muted">
                  Cô Bùi Thị Hoa: Sáng Thứ Bảy phát áo ấm mùa đông đợt 1 cho học sinh khối 10.
                </p>
              </Card>
              <Card variant="featured" className="flex flex-col gap-1.5">
                <p className="font-bold text-ink">★ Gia sư AI buổi tối</p>
                <p className="text-[13px] text-muted">
                  Ôn tập Hàm số bậc hai theo chủ đề lớp 10A1 (còn 28/30 câu hôm nay).
                </p>
              </Card>
              <HoldButton
                onTrigger={() =>
                  showToast('Đã phát tín hiệu SOS tới Quản sinh và Phòng Y tế', 'danger')
                }
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
