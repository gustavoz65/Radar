import type { EquityPosition } from '@/lib/types';
import { DataTable, type Column } from '@/components/common/data-table';
import { TrendValue } from '@/components/common/trend-value';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';

const kindLabels: Record<EquityPosition['kind'], string> = { acao: 'Ação', fii: 'FII' };

const columns: Column<EquityPosition>[] = [
  {
    key: 'ticker',
    header: 'Ativo',
    cell: (row) => (
      <div>
        <p className="font-mono text-sm font-semibold text-text">{row.ticker}</p>
        <p className="text-xs text-muted">
          {row.name} · {kindLabels[row.kind]}
        </p>
      </div>
    ),
  },
  {
    key: 'quantity',
    header: 'Quantidade',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{row.quantity}</span>,
  },
  {
    key: 'price',
    header: 'Preço',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{formatBRL(row.price)}</span>,
  },
  {
    key: 'changeDay',
    header: 'Dia',
    align: 'right',
    cell: (row) => <TrendValue value={row.changeDay} format="percent" className="text-sm" />,
  },
  {
    key: 'value',
    header: 'Valor atual',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{formatBRL(row.currentValue)}</span>,
  },
  {
    key: 'return',
    header: 'Resultado',
    align: 'right',
    cell: (row) => (
      <TrendValue
        value={percentChange(row.investedValue, row.currentValue)}
        format="percent"
        className="text-sm"
      />
    ),
  },
  {
    key: 'dy',
    header: 'DY a.a.',
    align: 'right',
    cell: (row) => (
      <span className="tabular font-mono text-sm text-muted">
        {formatPercent(row.dividendYield, 1)}
      </span>
    ),
  },
];

export function EquitiesTable({ positions }: { positions: EquityPosition[] }) {
  return <DataTable columns={columns} rows={positions} rowKey={(row) => row.id} />;
}
