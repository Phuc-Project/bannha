export type UserRole =
  | 'student'
  | 'teacher'
  | 'dorm_staff'
  | 'medical_staff'
  | 'kitchen_staff'
  | 'parent'
  | 'admin';

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Học sinh',
  teacher: 'Giáo viên chủ nhiệm',
  dorm_staff: 'Quản sinh',
  medical_staff: 'Nhân viên y tế',
  kitchen_staff: 'Nhà bếp',
  parent: 'Phụ huynh ở bản',
  admin: 'Quản trị trường',
};

export function isStaffRole(role: UserRole): boolean {
  return (
    role === 'teacher' ||
    role === 'dorm_staff' ||
    role === 'medical_staff' ||
    role === 'kitchen_staff' ||
    role === 'admin'
  );
}
