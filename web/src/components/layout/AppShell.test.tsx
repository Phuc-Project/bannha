import { render, screen } from '@testing-library/react';
import { Bell, BookOpen, CalendarCheck, Home, ShieldAlert, Utensils, Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { AppShell, type NavItem } from './AppShell';

const SIX_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Hôm nay', icon: Home, path: '/' },
  { id: 'dorm', label: 'Ký túc xá', icon: CalendarCheck, path: '/ktx' },
  { id: 'kitchen', label: 'Bếp ăn', icon: Utensils, path: '/bep' },
  { id: 'tutor', label: 'Gia sư', icon: BookOpen, path: '/gia-su' },
  { id: 'health', label: 'Y tế', icon: ShieldAlert, path: '/y-te' },
  { id: 'extra', label: 'Mục thứ 6', icon: Bell, path: '/extra' },
];

describe('AppShell role-adaptive desktop & mobile layout (§3.6)', () => {
  it('renders SyncBadge, max 5 BottomNav items, and NO Sidebar for student/parent', () => {
    const { container } = render(
      <AppShell
        role="student"
        title="Hôm nay của em"
        subtitle="Giàng A Páo · Lớp 10A1"
        syncState={{ status: 'synced', minutesAgo: 2 }}
        navItems={SIX_NAV_ITEMS}
        activePath="/"
      >
        <div>Nội dung việc hôm nay</div>
      </AppShell>,
    );

    expect(screen.getByText('Đã đồng bộ 2 phút trước')).toBeInTheDocument();
    expect(container.querySelector('aside')).toBeNull();

    const bottomNav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    expect(bottomNav.querySelectorAll('button')).toHaveLength(5);
    expect(screen.queryByText('Mục thứ 6')).not.toBeInTheDocument();
  });

  it('renders full-height left Sidebar with badge & footer for staff roles on desktop', () => {
    const staffNav: NavItem[] = [
      { id: 'desk', label: 'Điểm danh QR', icon: CalendarCheck, path: '/ca-truc' },
      { id: 'leaves', label: 'Duyệt đơn phép', icon: Users, path: '/duyet-don', badgeCount: 2 },
    ];

    const { container } = render(
      <AppShell
        role="dorm_staff"
        title="Ca trực Ký túc xá"
        subtitle="Quản sinh Nông Văn Toàn"
        schoolName="Trường PTDTNT [TÊN TRƯỜNG]"
        sidebarFooter="Trực KTX: 0218 3851 102"
        syncState={{ status: 'pending', pendingCount: 3 }}
        navItems={staffNav}
        activePath="/ca-truc"
      >
        <div>Danh sách điểm danh</div>
      </AppShell>,
    );

    expect(screen.getAllByText('Đang chờ gửi 3 mục').length).toBeGreaterThanOrEqual(1);
    const sidebar = container.querySelector('aside');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.className).toContain('lg:flex');
    expect(sidebar?.textContent).toContain('Trường PTDTNT [TÊN TRƯỜNG]');
    expect(sidebar?.textContent).toContain('Trực KTX: 0218 3851 102');
    expect(sidebar?.textContent).toContain('2');
  });

  it('hides desktop Sidebar when forceViewport="mobile" is used for styleguide preview', () => {
    const staffNav: NavItem[] = [
      { id: 'desk', label: 'Điểm danh QR', icon: CalendarCheck, path: '/ca-truc' },
    ];

    const { container } = render(
      <AppShell
        embedded
        forceViewport="mobile"
        role="dorm_staff"
        title="Ca trực Ký túc xá"
        syncState={{ status: 'synced', minutesAgo: 1 }}
        navItems={staffNav}
        activePath="/ca-truc"
      >
        <div>Xem khung điện thoại</div>
      </AppShell>,
    );

    expect(container.querySelector('aside')).toBeNull();
  });
});
