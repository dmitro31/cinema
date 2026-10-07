import type { ReactNode } from 'react';

import { Skeleton } from './ui';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  cell: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  dimmed?: boolean;
  minWidth?: number;
}

export function DataTable<T>({
  columns,
  rows,
  getKey,
  dimmed = false,
  minWidth = 760,
}: DataTableProps<T>) {
  return (
    <div
      className={`overflow-x-auto transition-opacity ${dimmed ? 'opacity-60' : ''}`}
    >
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-[#262631]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-5 py-3 text-xs font-medium uppercase tracking-wider text-[#6F6F7C] ${
                  column.align === 'right' ? 'text-right' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#1E1E28]">
          {rows.map((row) => (
            <tr key={getKey(row)} className="transition hover:bg-white/[0.02]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-5 py-3.5 align-middle text-[#D8D8E0] ${
                    column.align === 'right' ? 'text-right tabular-nums' : ''
                  }`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-11" />
      ))}
    </div>
  );
}
