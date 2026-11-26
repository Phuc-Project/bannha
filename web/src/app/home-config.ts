import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  HeartPulse,
  Home,
  PackageOpen,
  QrCode,
  ShieldAlert,
  Utensils,
} from 'lucide-react';
import type { NavItem } from '../components/layout/nav-types';
import type { UserRole } from '../lib/roles';

export type HomeDemoRole = Extract<UserRole, 'dorm_staff' | 'teacher' | 'student' | 'parent'>;

export interface HomeLeaveRow {
  id: string;
  student: string;
  room: string;
  timeRange: string;
  meals: string;
  approved: boolean;
}

export const INITIAL_HOME_LEAVES: HomeLeaveRow[] = [
  {
    id: 'l1',
    student: 'Giàng A Páo',
    room: '10A1 · Phòng A204',
    timeRange: '16:30 Thứ Sáu → 17:00 Chủ Nhật',
    meals: '4 bữa tự động',
    approved: false,
  },
  {
    id: 'l2',
    student: 'Triệu Văn Phú',
    room: '11A2 · Phòng B102',
    timeRange: '17:00 Thứ Bảy → 17:00 Chủ Nhật',
    meals: '3 bữa tự động',
    approved: false,
  },
];

export const HOME_NAV_BY_ROLE: Record<HomeDemoRole, NavItem[]> = {
  dorm_staff: [
    { id: 'qr', label: 'Điểm danh', icon: QrCode, path: '/' },
    { id: 'leaves', label: 'Đơn phép', icon: ClipboardCheck, path: '/leaves', badgeCount: 2 },
    { id: 'rooms', label: 'Phòng ở', icon: DoorOpen, path: '/rooms', badgeCount: 2 },
    { id: 'donations', label: 'Đồ cũ', icon: PackageOpen, path: '/donations' },
    { id: 'sos', label: 'Trực SOS', icon: ShieldAlert, path: '/sos' },
  ],
  teacher: [
    { id: 'grades', label: 'Bảng điểm lớp', icon: GraduationCap, path: '/' },
    { id: 'leaves', label: 'Duyệt đơn phép', icon: ClipboardCheck, path: '/leaves', badgeCount: 1 },
    { id: 'topics', label: 'Chủ đề Gia sư AI', icon: BookOpen, path: '/topics' },
  ],
  student: [
    { id: 'today', label: 'Hôm nay', icon: Home, path: '/' },
    { id: 'dorm', label: 'Ký túc xá', icon: CalendarClock, path: '/ktx' },
    { id: 'kitchen', label: 'Bếp ăn', icon: Utensils, path: '/bep' },
    { id: 'tutor', label: 'Gia sư', icon: BookOpen, path: '/gia-su' },
    { id: 'health', label: 'Y tế', icon: HeartPulse, path: '/y-te' },
  ],
  parent: [
    { id: 'today', label: 'Hôm nay', icon: Home, path: '/' },
    { id: 'grades', label: 'Điểm học', icon: GraduationCap, path: '/diem' },
    { id: 'leave', label: 'Lịch về', icon: CalendarClock, path: '/lich-ve' },
  ],
};

export const HOME_ROLE_META: Record<
  HomeDemoRole,
  { title: string; subtitle: string; footer: string }
> = {
  dorm_staff: {
    title: 'Ca trực Ký túc xá',
    subtitle: 'Quản sinh Nông Văn Toàn · Dãy A & Dãy B',
    footer: 'Trực KTX: 0218 3851 102',
  },
  teacher: {
    title: 'Lớp 10A1 — Chủ nhiệm & Bảng điểm',
    subtitle: 'Cô Bùi Thị Hoa · GVCN lớp 10A1',
    footer: 'Học kỳ I · 14 học sinh nội trú',
  },
  student: {
    title: 'Hôm nay của em',
    subtitle: 'Giàng A Páo · Lớp 10A1 · Phòng A204',
    footer: 'Dãy nội trú A',
  },
  parent: {
    title: 'Hôm nay của con',
    subtitle: 'Phụ huynh Giàng A Súa · Bản Tả Van',
    footer: 'Sổ liên lạc Bản – Trường',
  },
};
