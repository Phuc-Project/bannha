import { ArrowLeft, Monitor, Smartphone, Type } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTextSize } from '../../app/providers/text-size';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { SyncBadge, type SyncBadgeProps } from '../../components/ui/SyncBadge';
import { Tabs } from '../../components/ui/Tabs';
import { TribalStripe } from '../../components/ui/TribalStripe';
import { cx } from '../../lib/cx';
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

const SYNC_PRESETS: Record<SyncPresetKey, Omit<SyncBadgeProps, 'inverted'>> = {
  synced: { status: 'synced', minutesAgo: 2 },
  pending: { status: 'pending', pendingCount: 3 },
  offline: { status: 'offline' },
  error: { status: 'error', pendingCount: 1 },
};

const TOC_LINKS = [
  { href: '#role-previews', label: 'Màn mẫu 5 vai trò' },
  { href: '#foundations', label: '1. Bảng màu & WCAG' },
  { href: '#actions', label: '2. Nút & SOS 2 giây' },
  { href: '#forms', label: '3. Biểu mẫu & Chip' },
  { href: '#feedback', label: '4. Card ★ & Hộp thoại' },
] as const;

export default function StyleguidePage() {
  const { textSize, toggleTextSize } = useTextSize();
  const [syncKey, setSyncKey] = useState<SyncPresetKey>('synced');
  const [previewMode, setPreviewMode] = useState<'responsive' | 'mobile'>('responsive');
  const activeSync = SYNC_PRESETS[syncKey];

  const wrapPreview = (node: JSX.Element) => (
    <div className={cx(previewMode === 'mobile' && 'mx-auto w-full max-w-[360px]')}>{node}</div>
  );

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="sticky top-0 z-40">
        <TribalStripe />
      </div>

      <div className="flex min-w-0">
        {/* Desktop left TOC & controls rail (>= 1024px) */}
        <aside
          aria-label="Mục lục Styleguide"
          className="hidden w-[256px] shrink-0 flex-col border-r border-line bg-surface lg:sticky lg:top-[6px] lg:flex lg:h-[calc(100vh-6px)]"
        >
          <div className="border-b border-line bg-forest-900 px-4 py-4 text-surface">
            <p className="text-lg font-bold tracking-[-0.01em] text-surface">BẢN NHÀ</p>
            <p className="mt-0.5 text-[length:var(--font-size-sub)] text-cream/85">
              Duyệt giao diện Giai đoạn 0
            </p>
            <Link
              to="/"
              className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-control border border-cream/30 px-3 text-[length:var(--font-size-sub)] font-semibold text-cream hover:bg-surface/10"
            >
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Về màn chính</span>
            </Link>
          </div>

          <nav aria-label="Mục lục thành phần" className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-xs font-semibold text-muted">Danh mục kiểm duyệt</p>
            <ul className="flex flex-col gap-1">
              {TOC_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex min-h-[44px] items-center rounded-control px-3 py-2 text-[length:var(--font-size-sub)] font-semibold text-ink transition-colors duration-150 hover:bg-forest-50 hover:text-forest-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 px-1 text-xs font-semibold text-muted">Thử chế độ hiển thị</p>
              <Button variant="secondary" icon={Type} fullWidth onClick={toggleTextSize}>
                {textSize === 'large' ? 'Đang bật Chữ lớn' : 'Bật Chữ lớn (18px)'}
              </Button>
            </div>
          </nav>

          <div className="border-t border-line bg-cream/70 px-4 py-3 text-[length:var(--font-size-sub)] text-muted">
            <p className="font-semibold text-ink">{SCHOOL_INFO.name}</p>
            <p>Ngân sách JS &lt; 170KB gzip</p>
          </div>
        </aside>

        {/* Main content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-[6px] z-30 border-b border-line bg-forest-900 px-4 py-3 text-surface lg:static lg:bg-surface lg:px-6 lg:py-3.5 lg:text-ink">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[length:var(--font-size-section)] font-bold tracking-[-0.01em] text-surface lg:text-[length:var(--font-size-title)] lg:text-ink">
                  Hệ thống giao diện BẢN NHÀ
                </h1>
                <p className="text-[length:var(--font-size-sub)] text-cream/85 lg:text-muted">
                  Kiểm duyệt trọn bộ design tokens WCAG AA, component và bố cục Desktop 1280px ↔ Di
                  động 360px
                </p>
              </div>
              <SyncBadge {...activeSync} responsiveWorkspace />
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 lg:px-6 lg:py-6">
            {/* Global sync simulator bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-3.5">
              <span className="text-[length:var(--font-size-sub)] font-semibold text-muted">
                Giả lập trạng thái mạng / đồng bộ toàn trang:
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

            {/* 5 Realistic role previews with Desktop vs 360px toggle */}
            <section id="role-previews" className="flex flex-col gap-3">
              <SectionTitle
                title="Màn hình mẫu theo 5 vai trò (Desktop & Điện thoại)"
                subtitle="Mở thẳng vào việc cần làm hôm nay — nhân viên có Sidebar trái cố định trên Desktop"
                action={
                  <div className="hidden items-center gap-2 lg:flex">
                    <Chip
                      icon={Monitor}
                      selected={previewMode === 'responsive'}
                      onClick={() => setPreviewMode('responsive')}
                    >
                      Khổ Desktop
                    </Chip>
                    <Chip
                      icon={Smartphone}
                      selected={previewMode === 'mobile'}
                      onClick={() => setPreviewMode('mobile')}
                    >
                      Khổ Điện thoại 360px
                    </Chip>
                  </div>
                }
              />

              <Tabs
                ariaLabel="Chọn màn hình vai trò mẫu"
                defaultValue="staff"
                items={[
                  {
                    id: 'staff',
                    label: 'Quản sinh',
                    content: wrapPreview(
                      <StaffDeskPreview syncState={activeSync} forceViewport={previewMode} />,
                    ),
                  },
                  {
                    id: 'teacher',
                    label: 'Giáo viên',
                    content: wrapPreview(
                      <TeacherDeskPreview syncState={activeSync} forceViewport={previewMode} />,
                    ),
                  },
                  {
                    id: 'student',
                    label: 'Học sinh',
                    content: wrapPreview(
                      <StudentTodayPreview syncState={activeSync} forceViewport={previewMode} />,
                    ),
                  },
                  {
                    id: 'parent',
                    label: 'Phụ huynh',
                    content: wrapPreview(
                      <ParentTodayPreview syncState={activeSync} forceViewport={previewMode} />,
                    ),
                  },
                  {
                    id: 'login',
                    label: 'Đăng nhập',
                    content: wrapPreview(<LoginPreview />),
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
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[length:var(--font-size-sub)] text-muted lg:px-6">
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
