import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable, type DataColumn } from './DataTable';

interface LeaveRow {
  id: string;
  student: string;
  room: string;
  status: string;
}

const COLUMNS: DataColumn<LeaveRow>[] = [
  { key: 'student', header: 'Học sinh', render: (row) => row.student },
  { key: 'room', header: 'Phòng', render: (row) => row.room },
  { key: 'status', header: 'Trạng thái', render: (row) => row.status, align: 'right' },
];

const ROWS: LeaveRow[] = [
  { id: '1', student: 'Giàng A Páo', room: 'A204', status: 'Chờ duyệt' },
  { id: '2', student: 'Triệu Văn Phú', room: 'B102', status: 'Đã duyệt' },
];

describe('DataTable', () => {
  it('renders semantic desktop table headers and rows alongside mobile card fallback', () => {
    render(
      <DataTable
        caption="Danh sách đơn xin phép"
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
      />,
    );

    expect(screen.getByRole('table', { name: 'Danh sách đơn xin phép' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Học sinh' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Phòng' })).toBeInTheDocument();
    expect(screen.getAllByText('Giàng A Páo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Triệu Văn Phú').length).toBeGreaterThanOrEqual(1);
  });

  it('renders fallback text when rows are empty', () => {
    render(
      <DataTable
        caption="Danh sách trống"
        columns={COLUMNS}
        rows={[]}
        getRowKey={(row) => row.id}
        emptyMessage="Chưa có dữ liệu trong phiên này."
      />,
    );

    expect(screen.getByText('Chưa có dữ liệu trong phiên này.')).toBeInTheDocument();
  });
});
