import { render, screen, within } from '@testing-library/react';
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

describe('AppShell Desktop (>=768px) & F12 Mobile (<768px) layout', () => {
  it('renders Desktop left Sidebar and hides BottomNav above md (768px) while capping mobile tabs at 5', () => {
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
    const sidebar = container.querySelector('aside');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.className).toContain('md:flex');

    const bottomNav = screen.getByRole('navigation', { name: 'Điều hướng di động' });
    expect(bottomNav.className).toContain('md:hidden');
    expect(bottomNav.querySelectorAll('button')).toHaveLength(5);
    expect(within(bottomNav).queryByText('Mục thứ 6')).not.toBeInTheDocument();
  });

  it('shows school identity, badge count, and footer info inside forest Sidebar for staff roles', () => {
    const staffNav: NavItem[] = [
      { id: 'desk', label: 'Điểm danh', icon: CalendarCheck, path: '/ca-truc' },
      { id: 'leaves', label: 'Đơn phép', icon: Users, path: '/duyet-don', badgeCount: 2 },
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

    const sidebar = container.querySelector('aside');
    expect(sidebar?.textContent).toContain('Trường PTDTNT [TÊN TRƯỜNG]');
    expect(sidebar?.textContent).toContain('Trực KTX: 0218 3851 102');
    expect(sidebar?.textContent).toContain('2');
  });

  it('hides Desktop Sidebar and forces mobile BottomNav when forceViewport="mobile"', () => {
    const { container } = render(
      <AppShell
        embedded
        forceViewport="mobile"
        role="dorm_staff"
        title="Ca trực Ký túc xá"
        syncState={{ status: 'synced', minutesAgo: 1 }}
        navItems={SIX_NAV_ITEMS.slice(0, 4)}
        activePath="/"
      >
        <div>Xem khung điện thoại</div>
      </AppShell>,
    );

    expect(container.querySelector('aside')).toBeNull();
    const bottomNav = screen.getByRole('navigation', { name: 'Điều hướng di động' });
    expect(bottomNav.className).not.toContain('md:hidden');
  });
});
