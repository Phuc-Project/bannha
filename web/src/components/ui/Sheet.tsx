import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './IconButton';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, description, footer, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.hasAttribute('open')) {
      el.showModal();
    } else if (!open && el.hasAttribute('open')) {
      el.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 mt-auto max-h-[90vh] w-full max-w-none rounded-t-[16px] border-t border-line bg-surface p-0 text-ink shadow-overlay backdrop:bg-forest-900/50 sm:m-auto sm:max-w-lg sm:rounded-card sm:border"
    >
      <div className="p-4">
        <div
          aria-hidden="true"
          className="mx-auto mb-3 h-1.5 w-10 rounded-pill bg-line sm:hidden"
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-[length:var(--font-size-section)] font-bold text-ink">
              {title}
            </h3>
            {description ? (
              <p id={descId} className="mt-1 text-[length:var(--font-size-sub)] text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton icon={X} variant="ghost" aria-label="Đóng ngăn kéo" onClick={onClose} />
        </div>
        <div className="mt-3 text-[length:var(--font-size-body)]">{children}</div>
        {footer ? (
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
