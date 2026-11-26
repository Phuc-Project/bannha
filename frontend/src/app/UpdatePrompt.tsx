import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '../components/ui/Button';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 shadow-overlay"
    >
      <p className="text-[length:var(--font-size-body)] font-medium text-ink">
        Đã có phiên bản mới của BẢN NHÀ.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setNeedRefresh(false)}>
          Để sau
        </Button>
        <Button variant="primary" onClick={() => void updateServiceWorker(true)}>
          Cập nhật ngay
        </Button>
      </div>
    </div>
  );
}
