import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export interface DataColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  caption: string;
  columns: ReadonlyArray<DataColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  forceMobile?: boolean;
  className?: string;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyMessage = 'Chưa có dữ liệu.',
  forceMobile = false,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div
        className={cx(
          'rounded-card border border-line bg-surface p-4 text-[length:var(--font-size-body)] text-muted',
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cx('overflow-hidden rounded-card border border-line bg-surface', className)}>
      {/* Desktop semantic table */}
      <div className={cx(forceMobile ? 'hidden' : 'hidden overflow-x-auto md:block')}>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-forest-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cx(
                    'px-4 py-3 text-[length:var(--font-size-sub)] font-bold text-forest-700',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="transition-colors duration-150 hover:bg-cream/60">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      'px-4 py-3 align-middle text-[length:var(--font-size-body)] text-ink',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card stack (<= 767px or forceMobile) */}
      <div className={cx('divide-y divide-line', !forceMobile && 'md:hidden')}>
        {rows.map((row) => (
          <div key={getRowKey(row)} className="flex flex-col gap-2 p-4">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                <span className="shrink-0 text-[length:var(--font-size-sub)] font-semibold text-muted">
                  {col.header}
                </span>
                <div className="min-w-0 text-right text-[length:var(--font-size-body)] text-ink">
                  {col.render(row)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
