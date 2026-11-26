import { Award, Bell, BookOpen, ClipboardCheck, GraduationCap, Send } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../../app/providers/toast';
import { AppShell, type NavItem } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DataTable, type DataColumn } from '../../../components/ui/DataTable';
import { Field } from '../../../components/ui/Field';
import { IconTile } from '../../../components/ui/IconTile';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { Select } from '../../../components/ui/Select';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import type { SyncBadgeProps } from '../../../components/ui/SyncBadge';
import { Textarea } from '../../../components/ui/Textarea';
import { SCHOOL_INFO } from '../sampleData';

interface StudentGradeRow {
  id: string;
  name: string;
  ethnicity: string;
  score15m: string;
  midterm: string;
}

const INITIAL_GRADES: StudentGradeRow[] = [
  { id: 'hs24001', name: 'Giàng A Páo', ethnicity: 'Mông', score15m: '8.0', midterm: '8.5' },
  { id: 'hs24002', name: 'Vàng Thị Dua', ethnicity: 'Mông', score15m: '7.5', midterm: '8.0' },
  { id: 'hs24005', name: 'Hoàng Thị Lan', ethnicity: 'Tày', score15m: '9.0', midterm: '8.5' },
  { id: 'hs24007', name: 'Lò Thị Mai', ethnicity: 'Thái', score15m: '8.5', midterm: '9.0' },
];

const TEACHER_NAV: NavItem[] = [
  { id: 'grades', label: 'Bảng điểm lớp', icon: GraduationCap, path: '/teacher' },
  { id: 'notices', label: 'Thông báo lớp', icon: Bell, path: '/teacher/notices' },
  {
    id: 'leaves',
    label: 'Duyệt đơn phép',
    icon: ClipboardCheck,
    path: '/teacher/leaves',
    badgeCount: 1,
  },
  { id: 'topics', label: 'Chủ đề Gia sư AI', icon: BookOpen, path: '/teacher/topics' },
  {
    id: 'culture',
    label: 'Duyệt bài văn hóa',
    icon: Award,
    path: '/teacher/culture',
    badgeCount: 2,
  },
];

export interface RolePreviewProps {
  syncState: Omit<SyncBadgeProps, 'inverted'>;
  forceViewport?: 'responsive' | 'mobile';
}

function calcAvg(a: string, b: string): string {
  const n1 = Number.parseFloat(a);
  const n2 = Number.parseFloat(b);
  if (Number.isNaN(n1) || Number.isNaN(n2)) return '—';
  return ((n1 + n2 * 2) / 3).toFixed(1).replace('.', ',');
}

export function TeacherDeskPreview({ syncState, forceViewport = 'responsive' }: RolePreviewProps) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<StudentGradeRow[]>(INITIAL_GRADES);
  const isMobile = forceViewport === 'mobile';

  const updateScore = (id: string, field: 'score15m' | 'midterm', value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const columns: DataColumn<StudentGradeRow>[] = [
    {
      key: 'name',
      header: 'Học sinh (Lớp 10A1)',
      render: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.name}</p>
          <p className="text-[length:var(--font-size-sub)] text-muted">
            {row.id} · Dân tộc {row.ethnicity}
          </p>
        </div>
      ),
    },
    {
      key: 'score15m',
      header: 'Điểm 15 phút',
      align: 'center',
      render: (row) => (
        <input
          type="text"
          inputMode="decimal"
          aria-label={`Điểm 15 phút của ${row.name}`}
          value={row.score15m}
          onChange={(e) => updateScore(row.id, 'score15m', e.target.value)}
          className="h-11 w-20 rounded-control border border-line bg-surface px-2 text-center font-semibold text-ink focus:border-forest-700"
        />
      ),
    },
    {
      key: 'midterm',
      header: 'Giữa kỳ',
      align: 'center',
      render: (row) => (
        <input
          type="text"
          inputMode="decimal"
          aria-label={`Điểm giữa kỳ của ${row.name}`}
          value={row.midterm}
          onChange={(e) => updateScore(row.id, 'midterm', e.target.value)}
          className="h-11 w-20 rounded-control border border-line bg-surface px-2 text-center font-semibold text-ink focus:border-forest-700"
        />
      ),
    },
    {
      key: 'avg',
      header: 'Tạm tính',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-forest-700">{calcAvg(row.score15m, row.midterm)}</span>
      ),
    },
  ];

  return (
    <AppShell
      embedded
      forceViewport={forceViewport}
      role="teacher"
      title="Lớp 10A1 — Bảng điểm & Sổ liên lạc"
      subtitle="Cô Bùi Thị Hoa · GVCN lớp 10A1"
      schoolName={SCHOOL_INFO.name}
      sidebarFooter="Học kỳ I · Năm học 2026–2027"
      syncState={syncState}
      navItems={TEACHER_NAV}
      activePath="/teacher"
    >
      <div className="flex flex-col gap-5">
        <div
          className={isMobile ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 gap-3 sm:grid-cols-3'}
        >
          <Card className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[length:var(--font-size-sub)] text-muted">Sĩ số hôm nay</p>
              <p className="text-xl font-bold text-ink">14 / 14 có mặt</p>
            </div>
            <StatusBadge tone="success" label="Đầy đủ" />
          </Card>
          <Card className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[length:var(--font-size-sub)] text-muted">Phụ huynh đã đọc tin</p>
              <p className="text-xl font-bold text-ink">11 / 14 gia đình</p>
            </div>
            <StatusBadge tone="forest" label="Tuần 12" />
          </Card>
          <Card className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[length:var(--font-size-sub)] text-muted">
                Đơn xin về chờ xác nhận
              </p>
              <p className="text-xl font-bold text-clay-600">1 đơn mới</p>
            </div>
            <StatusBadge tone="warning" label="Cần xem" />
          </Card>
        </div>

        <div
          className={isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-5 xl:grid-cols-12'}
        >
          <div className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-3 xl:col-span-8'}>
            <SectionTitle
              title="Nhập điểm nhanh môn Toán (Phím Tab đi ô kế tiếp)"
              subtitle="Điểm lưu vào máy ngay cả khi mất mạng và tự báo về Sổ liên lạc Phụ huynh"
              action={
                <Button
                  variant="primary"
                  onClick={() =>
                    showToast(
                      'Đã lưu bảng điểm Toán lớp 10A1 và gửi thông báo tới Phụ huynh',
                      'success',
                    )
                  }
                >
                  Lưu bảng điểm
                </Button>
              }
            />
            <DataTable
              caption="Bảng nhập điểm môn Toán lớp 10A1"
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              forceMobile={isMobile}
            />
          </div>

          <div className={isMobile ? 'flex flex-col gap-3' : 'flex flex-col gap-4 xl:col-span-4'}>
            <Card className="flex flex-col gap-3">
              <p className="font-bold text-ink">Gửi thông báo tới Phụ huynh lớp 10A1</p>
              <Field id="teacher-audience" label="Người nhận">
                <Select
                  id="teacher-audience"
                  options={[
                    { value: 'class', label: 'Toàn bộ Phụ huynh & Học sinh lớp 10A1' },
                    { value: 'parents', label: 'Chỉ Phụ huynh lớp 10A1' },
                    { value: 'student', label: 'Riêng em Giàng A Páo' },
                  ]}
                />
              </Field>
              <Field id="teacher-notice-body" label="Nội dung ngắn gọn">
                <Textarea
                  id="teacher-notice-body"
                  rows={3}
                  defaultValue="Sáng Thứ Bảy nhà trường phát áo ấm mùa đông đợt 1 cho học sinh khối 10. Kính báo Phụ huynh nắm thông tin."
                />
              </Field>
              <Button
                variant="primary"
                icon={Send}
                fullWidth
                onClick={() => showToast('Đã gửi thông báo tới 14 phụ huynh lớp 10A1', 'success')}
              >
                Gửi thông báo lớp
              </Button>
            </Card>

            <Card variant="featured" className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <IconTile icon={BookOpen} featured size="sm" />
                <p className="font-bold text-ink">★ Thống kê Gia sư AI tuần 12</p>
              </div>
              <p className="text-[length:var(--font-size-sub)] text-muted">
                Chủ đề hỏi nhiều nhất: <strong>Hàm số bậc hai</strong> (19 lượt) ·{' '}
                <strong>Phương trình chứa căn</strong> (11 lượt). Chỉ hiển thị thống kê chung, ẩn
                nội dung hỏi riêng của từng em.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
