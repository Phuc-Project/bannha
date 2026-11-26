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
          'rounded-[8px] border border-line bg-surface p-4 text-[14px] text-muted',
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cx('overflow-hidden rounded-[8px] border border-line bg-surface', className)}>
      {/* Desktop compact ledger table */}
      <div className={cx(forceMobile ? 'hidden' : 'hidden overflow-x-auto md:block')}>
        <table className="w-full border-collapse text-left tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-cream/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cx(
                    'px-4 py-2.5 text-[13px] font-semibold text-muted',
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
              <tr key={getRowKey(row)} className="transition-colors duration-100 hover:bg-cream/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      'px-4 py-2.5 align-middle text-[14px] text-ink',
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

      {/* Mobile card stack (< 768px / F12 mobile view) */}
      <div className={cx('divide-y divide-line', !forceMobile && 'md:hidden')}>
        {rows.map((row) => (
          <div key={getRowKey(row)} className="flex flex-col gap-1.5 p-3.5">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                <span className="shrink-0 text-[13px] font-medium text-muted">{col.header}</span>
                <div className="min-w-0 text-right text-[14px] text-ink">{col.render(row)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
