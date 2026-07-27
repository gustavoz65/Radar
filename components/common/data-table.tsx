import { cn } from '@/lib/utils';
import { dataLabelClass } from '@/components/common/typography';
import { surfaceCardClass, surfaceClass } from '@/components/common/surface';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

export function DataTable<T>({ columns, rows, rowKey }: DataTableProps<T>) {
  const [primary, ...rest] = columns;

  return (
    <>
      {/* Desktop: real table */}
      <div className={cn('hidden overflow-x-auto md:block', surfaceClass)}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3',
                    dataLabelClass,
                    column.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-text',
                      column.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className={surfaceCardClass}>
            <div className="mb-3 text-text">{primary.cell(row)}</div>
            <dl className="space-y-1.5">
              {rest.map((column) => (
                <div key={column.key} className="flex items-baseline justify-between gap-3">
                  <dt className={dataLabelClass}>{column.header}</dt>
                  <dd className="text-sm text-text">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
