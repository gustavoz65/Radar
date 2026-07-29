import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { SubsectionTitle } from '@/components/common/typography';
import { KindFilter } from '@/components/equities/kind-filter';
import { MarketQuotesTable } from '@/components/market/market-quotes-table';
import { formatBRL } from '@/lib/format/money';
import { percentChange } from '@/lib/format/percent';
import { getEquityMarket, getEquityPositions } from '@/lib/data/services';

export default async function AcoesPage() {
  const [positions, market] = await Promise.all([getEquityPositions(), getEquityMarket()]);

  const total = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const invested = positions.reduce((sum, position) => sum + position.investedValue, 0);
  const best = market.reduce<(typeof market)[number] | null>(
    (top, quote) =>
      quote.changePercent !== null && (!top || quote.changePercent > (top.changePercent ?? 0))
        ? quote
        : top,
    null,
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Ações e FIIs"
        description="Cotações da B3, e a sua posição quando houver."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sua posição" value={formatBRL(total)} />
        <StatCard
          label="Resultado acumulado"
          value={positions.length > 0 ? formatBRL(total - invested) : '—'}
          hint={
            positions.length > 0 ? (
              <TrendValue value={percentChange(invested, total)} format="percent" />
            ) : undefined
          }
        />
        <StatCard
          label="Maior alta do dia"
          value={best?.ticker ?? '—'}
          hint={
            best?.changePercent != null ? (
              <TrendValue value={best.changePercent} format="percent" />
            ) : undefined
          }
        />
        <StatCard label="Ativos acompanhados" value={String(market.length)} />
      </section>

      <section className="space-y-3">
        <SubsectionTitle>Mercado</SubsectionTitle>
        <MarketQuotesTable
          quotes={market}
          emptyDescription='Clique em "Atualizar agora" na visão geral para buscar as cotações da B3.'
        />
      </section>

      {positions.length > 0 ? (
        <section className="space-y-3">
          <SubsectionTitle>Sua carteira</SubsectionTitle>
          <KindFilter positions={positions} />
        </section>
      ) : null}
    </div>
  );
}
