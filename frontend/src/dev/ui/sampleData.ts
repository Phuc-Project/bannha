export const SCHOOL_INFO = {
  name: 'Trường PTDTNT [TÊN TRƯỜNG]',
  dormHotline: '02183851102',
  dormHotlineDisplay: '0218 3851 102',
  medicalHotline: '02183851115',
  medicalHotlineDisplay: '0218 3851 115',
  mealCutoffHour: '15:00',
} as const;

export const TECHNICAL_COMMITMENTS = [
  'Dùng được khi mất mạng',
  'Một tài khoản cho cả trường',
  'Nhẹ, chạy máy cấu hình thấp',
] as const;

export const ONBOARDING_STEPS = [
  { step: 1, text: 'Đăng nhập bằng tài khoản trường cấp' },
  { step: 2, text: 'Chọn vai trò (nếu kiêm nhiệm nhiều việc)' },
  { step: 3, text: 'Dùng mọi chức năng, kể cả khi mất mạng' },
  { step: 4, text: 'Tự đồng bộ khi có sóng' },
] as const;

export const ETHNIC_GROUPS = [
  'Mông',
  'Dao',
  'Tày',
  'Thái',
  'Mường',
  'Nùng',
  'Khơ Mú',
  'Hà Nhì',
  'Sán Dìu',
  'Giáy',
] as const;

export const SAMPLE_GRADES = [
  { subject: 'Toán học', score: 8.2, text: '8,2' },
  { subject: 'Ngữ văn', score: 7.8, text: '7,8' },
  { subject: 'Vật lý', score: 8.5, text: '8,5' },
  { subject: 'Lịch sử & Địa lý', score: 9.0, text: '9,0' },
] as const;
