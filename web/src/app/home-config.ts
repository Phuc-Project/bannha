import {
  Award,
  Bell,
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
  ethnicity: string;
  room: string;
  timeRange: string;
  meals: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AttendanceRow {
  id: string;
  code: string;
  student: string;
  classRoom: string;
  checkedAt: string;
  status: 'present' | 'excused' | 'missing';
}

export const INITIAL_HOME_LEAVES: HomeLeaveRow[] = [
  {
    id: 'l1',
    student: 'Giàng A Páo',
    ethnicity: 'Mông',
    room: '10A1 · A204',
    timeRange: '16:30 T6 → 17:00 CN',
    meals: 'Cắt 4 bữa',
    status: 'pending',
  },
  {
    id: 'l2',
    student: 'Triệu Văn Phú',
    ethnicity: 'Dao',
    room: '11A2 · B102',
    timeRange: '17:00 T7 → 17:00 CN',
    meals: 'Cắt 3 bữa',
    status: 'pending',
  },
  {
    id: 'l3',
    student: 'Vàng Thị Dua',
    ethnicity: 'Mông',
    room: '10A1 · A201',
    timeRange: '16:30 T6 → 17:00 CN',
    meals: 'Cắt 4 bữa',
    status: 'approved',
  },
];

export const EVENING_ATTENDANCE_ROWS: AttendanceRow[] = [
  {
    id: 'a1',
    code: 'hs24001',
    student: 'Giàng A Páo',
    classRoom: '10A1 · Phòng A204',
    checkedAt: '19:31 (QR)',
    status: 'present',
  },
  {
    id: 'a2',
    code: 'hs24002',
    student: 'Vàng Thị Dua',
    classRoom: '10A1 · Phòng A201',
    checkedAt: '19:32 (QR)',
    status: 'present',
  },
  {
    id: 'a3',
    code: 'hs24003',
    student: 'Triệu Văn Phú',
    classRoom: '11A2 · Phòng B102',
    checkedAt: 'Nghỉ tại phòng y tế',
    status: 'excused',
  },
  {
    id: 'a4',
    code: 'hs24004',
    student: 'Bàn Thị Mây',
    classRoom: '11A2 · Phòng B204',
    checkedAt: '19:33 (QR)',
    status: 'present',
  },
  {
    id: 'a5',
    code: 'hs24005',
    student: 'Hoàng Thị Lan',
    classRoom: '10A1 · Phòng A202',
    checkedAt: '19:34 (QR)',
    status: 'present',
  },
  {
    id: 'a6',
    code: 'hs24011',
    student: 'Lò Văn Pắn',
    classRoom: '11A2 · Phòng A103',
    checkedAt: 'Chưa ghi nhận',
    status: 'missing',
  },
];

export const HOME_NAV_BY_ROLE: Record<HomeDemoRole, NavItem[]> = {
  dorm_staff: [
    { id: 'qr', label: 'Điểm danh', icon: QrCode, path: '/' },
    { id: 'leaves', label: 'Đơn phép', icon: ClipboardCheck, path: '/leaves', badgeCount: 2 },
    { id: 'rooms', label: 'Phòng ở', icon: DoorOpen, path: '/rooms', badgeCount: 3 },
    { id: 'donations', label: 'Đồ cũ', icon: PackageOpen, path: '/donations' },
    { id: 'sos', label: 'Trực SOS', icon: ShieldAlert, path: '/sos' },
  ],
  teacher: [
    { id: 'grades', label: 'Bảng điểm', icon: GraduationCap, path: '/' },
    { id: 'notices', label: 'Thông báo', icon: Bell, path: '/notices' },
    { id: 'leaves', label: 'Đơn phép', icon: ClipboardCheck, path: '/leaves', badgeCount: 1 },
    { id: 'topics', label: 'Gia sư AI', icon: BookOpen, path: '/topics' },
    { id: 'culture', label: 'Kho văn hóa', icon: Award, path: '/culture', badgeCount: 2 },
  ],
  student: [
    { id: 'today', label: 'Hôm nay', icon: Home, path: '/' },
    { id: 'dorm', label: 'Ký túc xá', icon: CalendarClock, path: '/ktx' },
    { id: 'kitchen', label: 'Bếp ăn', icon: Utensils, path: '/bep' },
    { id: 'tutor', label: 'Gia sư AI', icon: BookOpen, path: '/gia-su' },
    { id: 'health', label: 'Y tế', icon: HeartPulse, path: '/y-te' },
  ],
  parent: [
    { id: 'today', label: 'Hôm nay', icon: Home, path: '/' },
    { id: 'grades', label: 'Điểm học', icon: GraduationCap, path: '/diem' },
    { id: 'leave', label: 'Lịch về', icon: CalendarClock, path: '/lich-ve' },
    { id: 'notices', label: 'Thông báo', icon: Bell, path: '/thong-bao' },
  ],
};

export const HOME_ROLE_META: Record<
  HomeDemoRole,
  { title: string; subtitle: string; user: string; footer: string; primaryAction: string }
> = {
  dorm_staff: {
    title: 'Ca trực Ký túc xá',
    subtitle: 'Thứ Năm, 26/11/2026 · Dãy nhà A & B',
    user: 'Quản sinh Nông Văn Toàn',
    footer: 'Trực KTX: 0218 3851 102',
    primaryAction: 'Mở máy quét QR',
  },
  teacher: {
    title: 'Sổ điểm & Liên lạc lớp 10A1',
    subtitle: 'Học kỳ I · Năm học 2026–2027',
    user: 'Cô Bùi Thị Hoa (GVCN)',
    footer: '14 học sinh nội trú',
    primaryAction: 'Lưu bảng điểm',
  },
  student: {
    title: 'Hôm nay của em',
    subtitle: 'Thứ Năm, 26/11/2026 · Lớp 10A1 · Phòng A204',
    user: 'Giàng A Páo (hs24001)',
    footer: 'Dãy nội trú A',
    primaryAction: 'Mở thẻ QR cá nhân',
  },
  parent: {
    title: 'Sổ liên lạc — Hôm nay của con',
    subtitle: 'Giàng A Páo (10A1) & Giàng Thị Mỷ (11A2)',
    user: 'Phụ huynh Giàng A Súa',
    footer: 'Bản Tả Van',
    primaryAction: 'Tạo đơn xin về',
  },
};
