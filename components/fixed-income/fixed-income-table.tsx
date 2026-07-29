import type { FixedIncomePosition } from '@/lib/types';
import { DataTable, type Column } from '@/components/common/data-table';
import { TrendValue } from '@/components/common/trend-value';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';
import { formatDate } from '@/lib/format/date';

const liquidityLabels: Record<FixedIncomePosition['liquidity'], string> = {
  diaria: 'Diária',
  vencimento: 'No vencimento',
};

const columns: Column<FixedIncomePosition>[] = [
  {
    key: 'name',
    header: 'Título',
    cell: (row) => (
      <div>
        <p className="text-sm font-medium text-text">{row.name}</p>
        <p className="text-xs text-muted">{row.issuer}</p>
      </div>
    ),
  },
  { key: 'rate', header: 'Taxa', cell: (row) => <span className="text-sm">{row.rateLabel}</span> },
  {
    key: 'effective',
    header: 'Equivalente a.a.',
    align: 'right',
    // A dash, not 0%: Radar does not know the equivalent rate for a synced
    // holding yet, and 0% would read as "this yields nothing".
    cell: (row) => (
      <span className="tabular font-mono text-sm">
        {row.effectiveAnnualRate === null ? '—' : formatPercent(row.effectiveAnnualRate)}
      </span>
    ),
  },
  {
    key: 'liquidity',
    header: 'Liquidez',
    cell: (row) => <span className="text-sm">{liquidityLabels[row.liquidity]}</span>,
  },
  {
    key: 'maturity',
    header: 'Vencimento',
    cell: (row) => (
      <span className="tabular font-mono text-sm">
        {row.maturity === null ? '—' : formatDate(row.maturity)}
      </span>
    ),
  },
  {
    key: 'value',
    header: 'Valor atual',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{formatBRL(row.currentValue)}</span>,
  },
  {
    key: 'return',
    header: 'Rentabilidade',
    align: 'right',
    // A synced caixinha has no deposit history, so its return is unknown rather
    // than zero — and "0,00%" would read as a confident "rendeu nada".
    cell: (row) =>
      row.source === 'pierre' ? (
        <span className="text-sm text-muted">—</span>
      ) : (
        <TrendValue
          value={percentChange(row.investedValue, row.currentValue)}
          format="percent"
          className="text-sm"
        />
      ),
  },
];

export function FixedIncomeTable({ positions }: { positions: FixedIncomePosition[] }) {
  return <DataTable columns={columns} rows={positions} rowKey={(row) => row.id} />;
}
