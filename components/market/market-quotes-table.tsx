import { DataTable, type Column } from '@/components/common/data-table';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { formatBRL } from '@/lib/format/money';
import type { MarketQuote } from '@/lib/types';

/** Crypto trades in fractions of a real; a share does not. */
function formatPrice(price: number): string {
  return price < 1 ? `R$ ${price.toFixed(4).replace('.', ',')}` : formatBRL(price);
}

const columns: Column<MarketQuote>[] = [
  {
    key: 'ticker',
    header: 'Ativo',
    cell: (quote) => <span className="font-mono text-sm text-text">{quote.ticker}</span>,
  },
  {
    key: 'price',
    header: 'Preço',
    align: 'right',
    cell: (quote) => (
      <span className="tabular font-mono text-sm">{formatPrice(quote.priceBrl)}</span>
    ),
  },
  {
    key: 'change',
    header: 'Variação',
    align: 'right',
    cell: (quote) =>
      quote.changePercent === null ? (
        <span className="text-sm text-muted">—</span>
      ) : (
        <TrendValue value={quote.changePercent} format="percent" className="text-sm" />
      ),
  },
];

export function MarketQuotesTable({
  quotes,
  emptyDescription,
}: {
  quotes: MarketQuote[];
  emptyDescription: string;
}) {
  if (quotes.length === 0) {
    return <EmptyState title="Nenhuma cotação coletada ainda" description={emptyDescription} />;
  }

  return <DataTable columns={columns} rows={quotes} rowKey={(quote) => quote.ticker} />;
}
