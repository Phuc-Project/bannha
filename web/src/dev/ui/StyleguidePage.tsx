import { ArrowLeft, Type } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTextSize } from '../../app/providers/text-size';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { SyncBadge, type SyncBadgeProps } from '../../components/ui/SyncBadge';
import { Tabs } from '../../components/ui/Tabs';
import { TribalStripe } from '../../components/ui/TribalStripe';
import { LoginPreview } from './previews/LoginPreview';
import { ParentTodayPreview } from './previews/ParentTodayPreview';
import { StaffDeskPreview } from './previews/StaffDeskPreview';
import { StudentTodayPreview } from './previews/StudentTodayPreview';
import { TeacherDeskPreview } from './previews/TeacherDeskPreview';
import { SCHOOL_INFO } from './sampleData';
import { ActionsSection } from './sections/ActionsSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { FormsSection } from './sections/FormsSection';
import { FoundationsSection } from './sections/FoundationsSection';

type SyncPresetKey = 'synced' | 'pending' | 'offline' | 'error';

const SYNC_PRESETS: Record<
  SyncPresetKey,
  Omit<SyncBadgeProps, 'inverted' | 'responsiveWorkspace'>
> = {
  synced: { status: 'synced', minutesAgo: 2 },
  pending: { status: 'pending', pendingCount: 3 },
  offline: { status: 'offline' },
  error: { status: 'error', pendingCount: 1 },
};

const TOC_LINKS = [
  { href: '#role-previews', label: 'Màn hình 5 vai trò' },
  { href: '#foundations', label: '1. Bảng màu & WCAG' },
  { href: '#actions', label: '2. Nút & SOS 2 giây' },
  { href: '#forms', label: '3. Biểu mẫu & Chip' },
  { href: '#feedback', label: '4. Card ★ & Hộp thoại' },
] as const;

export default function StyleguidePage() {
  const { textSize, toggleTextSize } = useTextSize();
  const [syncKey, setSyncKey] = useState<SyncPresetKey>('synced');
  const activeSync = SYNC_PRESETS[syncKey];

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="sticky top-0 z-40">
        <TribalStripe />
      </div>

      <div className="flex min-w-0">
        {/* Desktop left TOC rail (>= 768px) */}
        <aside
          aria-label="Mục lục Styleguide"
          className="hidden w-[240px] shrink-0 flex-col bg-forest-900 text-cream md:sticky md:top-[6px] md:flex md:h-[calc(100vh-6px)]"
        >
          <div className="border-b border-cream/15 px-5 py-4">
            <p className="text-[19px] font-bold tracking-[-0.01em] text-surface">BẢN NHÀ</p>
            <p className="mt-0.5 text-[13px] text-cream/75">Hệ thống giao diện (/dev/ui)</p>
          </div>

          <nav aria-label="Mục lục thành phần" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-0.5">
              {TOC_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex min-h-[38px] items-center rounded-[6px] px-3 py-2 text-[14px] font-medium text-cream/85 transition-colors hover:bg-surface/10 hover:text-surface"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-cream/15 pt-4">
              <Button variant="secondary" size="sm" icon={Type} fullWidth onClick={toggleTextSize}>
                {textSize === 'large' ? 'Đang bật Chữ lớn' : 'Bật Chữ lớn (18px)'}
              </Button>
            </div>
          </nav>

          <div className="border-t border-cream/15 px-4 py-3.5 text-[13px]">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-medium text-cream/85 hover:text-surface"
            >
              <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>Quay lại ứng dụng</span>
            </Link>
          </div>
        </aside>

        {/* Main content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-[6px] z-30 border-b border-line bg-forest-900 px-4 py-3 text-surface md:static md:bg-surface md:px-6 md:py-3.5 md:text-ink">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[19px] font-bold tracking-[-0.01em] text-surface md:text-[21px] md:text-ink">
                  Hệ thống giao diện BẢN NHÀ
                </h1>
                <p className="text-[13px] text-cream/80 md:text-muted">
                  Tài liệu chuẩn hóa token màu WCAG AA, component và bố cục Desktop / F12 Mobile
                </p>
              </div>
              <SyncBadge {...activeSync} responsiveWorkspace />
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-5 md:px-6 md:py-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <span className="text-[13px] font-medium text-muted">
                Kiểm thử trạng thái đồng bộ:
              </span>
              <div className="flex flex-wrap gap-2">
                <Chip selected={syncKey === 'synced'} onClick={() => setSyncKey('synced')}>
                  Giả lập: Đã đồng bộ
                </Chip>
                <Chip selected={syncKey === 'pending'} onClick={() => setSyncKey('pending')}>
                  Giả lập: Đang chờ gửi
                </Chip>
                <Chip selected={syncKey === 'offline'} onClick={() => setSyncKey('offline')}>
                  Giả lập: Ngoại tuyến
                </Chip>
                <Chip selected={syncKey === 'error'} onClick={() => setSyncKey('error')}>
                  Giả lập: Lỗi đồng bộ
                </Chip>
              </div>
            </div>

            <section id="role-previews" className="flex flex-col gap-3">
              <SectionTitle
                title="Màn hình mẫu theo 5 vai trò"
                subtitle="Mở bình thường là bố cục Desktop toàn màn hình; thu nhỏ hoặc bấm F12 (< 768px) để xem chế độ điện thoại"
              />

              <Tabs
                ariaLabel="Chọn màn hình vai trò mẫu"
                defaultValue="staff"
                items={[
                  {
                    id: 'staff',
                    label: 'Quản sinh',
                    content: <StaffDeskPreview syncState={activeSync} />,
                  },
                  {
                    id: 'teacher',
                    label: 'Giáo viên',
                    content: <TeacherDeskPreview syncState={activeSync} />,
                  },
                  {
                    id: 'student',
                    label: 'Học sinh',
                    content: <StudentTodayPreview syncState={activeSync} />,
                  },
                  {
                    id: 'parent',
                    label: 'Phụ huynh',
                    content: <ParentTodayPreview syncState={activeSync} />,
                  },
                  {
                    id: 'login',
                    label: 'Đăng nhập',
                    content: <LoginPreview />,
                  },
                ]}
              />
            </section>

            <div id="foundations">
              <FoundationsSection />
            </div>
            <div id="actions">
              <ActionsSection />
            </div>
            <div id="forms">
              <FormsSection />
            </div>
            <div id="feedback">
              <FeedbackSection />
            </div>
          </main>

          <footer className="mt-8 border-t border-line bg-surface">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-[13px] text-muted md:px-6">
              <span>Đơn vị: {SCHOOL_INFO.name}</span>
              <span className="font-semibold text-forest-700">BẢN NHÀ — Xa bản, vẫn có nhà.</span>
            </div>
            <TribalStripe />
          </footer>
        </div>
      </div>
    </div>
  );
}
