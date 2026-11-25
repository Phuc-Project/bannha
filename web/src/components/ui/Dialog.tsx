import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './IconButton';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, description, footer, children }: DialogProps) {
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-line bg-surface p-0 text-ink shadow-overlay backdrop:bg-forest-900/50"
    >
      <div className="p-4">
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
          <IconButton icon={X} variant="ghost" aria-label="Đóng hộp thoại" onClick={onClose} />
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
