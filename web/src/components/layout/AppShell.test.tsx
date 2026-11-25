import { render, screen } from '@testing-library/react';
import { Bell, BookOpen, CalendarCheck, Home, ShieldAlert, Utensils, Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';
import type { NavItem } from './nav-types';

const SIX_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Hôm nay', icon: Home, path: '/' },
  { id: 'dorm', label: 'Ký túc xá', icon: CalendarCheck, path: '/ktx' },
  { id: 'kitchen', label: 'Bếp ăn', icon: Utensils, path: '/bep' },
  { id: 'tutor', label: 'Gia sư', icon: BookOpen, path: '/gia-su' },
  { id: 'health', label: 'Y tế', icon: ShieldAlert, path: '/y-te' },
  { id: 'extra', label: 'Mục thứ 6', icon: Bell, path: '/extra' },
];

describe('AppShell role-adaptive layout', () => {
  it('renders TribalStripe, SyncBadge, max 5 BottomNav items, and NO Sidebar for student/parent', () => {
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

  it('renders desktop Sidebar (>= 1024px) alongside mobile BottomNav for staff roles', () => {
    const staffNav: NavItem[] = [
      { id: 'desk', label: 'Ca trực', icon: CalendarCheck, path: '/truc' },
      { id: 'students', label: 'Học sinh', icon: Users, path: '/hoc-sinh' },
    ];

    const { container } = render(
      <AppShell
        role="dorm_staff"
        title="Ca trực Ký túc xá"
        subtitle="Quản sinh Nông Văn Toàn"
        syncState={{ status: 'pending', pendingCount: 3 }}
        navItems={staffNav}
        activePath="/truc"
      >
        <div>Danh sách điểm danh</div>
      </AppShell>,
    );

    expect(screen.getByText('Đang chờ gửi 3 mục')).toBeInTheDocument();
    const sidebar = container.querySelector('aside');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.className).toContain('lg:flex');
  });
});
