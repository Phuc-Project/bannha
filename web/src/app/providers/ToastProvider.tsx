import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { ToastContext, type ToastTone } from './toast';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = 'default') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md lg:bottom-6"
        >
          <div
            className={cx(
              'flex items-center justify-between gap-3 rounded-card border px-4 py-3 shadow-overlay',
              toast.tone === 'danger'
                ? 'border-danger bg-danger text-surface'
                : toast.tone === 'success'
                  ? 'border-success bg-success text-surface'
                  : 'border-forest-900 bg-forest-900 text-surface',
            )}
          >
            <span className="text-[length:var(--font-size-body)] font-medium">{toast.message}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setToast(null)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control hover:bg-surface/10"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
