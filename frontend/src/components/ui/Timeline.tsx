import { cx } from '../../lib/cx';

export interface TimelineItem {
  id: string;
  title: string;
  time: string;
  note?: string;
  tone?: 'done' | 'current' | 'pending' | 'danger';
}

export interface TimelineProps {
  items: ReadonlyArray<TimelineItem>;
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cx('flex flex-col', className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const tone = item.tone ?? 'pending';
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cx(
                  'mt-1.5 h-3 w-3 shrink-0 rounded-pill border-2',
                  tone === 'done' && 'border-success bg-success',
                  tone === 'current' && 'border-forest-700 bg-turmeric',
                  tone === 'pending' && 'border-line bg-surface',
                  tone === 'danger' && 'border-danger bg-danger',
                )}
              />
              {!isLast ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-line" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[length:var(--font-size-body)] font-semibold text-ink">
                  {item.title}
                </p>
                <span className="text-[length:var(--font-size-sub)] text-muted">{item.time}</span>
              </div>
              {item.note ? (
                <p className="mt-0.5 text-[length:var(--font-size-sub)] text-muted">{item.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
