import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { Readout } from '@/components/common/readout';
import { TrendValue } from '@/components/common/trend-value';
import { SubsectionTitle } from '@/components/common/typography';
import { KindFilter } from '@/components/equities/kind-filter';
import { MarketQuotesTable } from '@/components/market/market-quotes-table';
import { percentChange } from '@/lib/format/percent';
import { getEquityMarket, getEquityPositions } from '@/lib/data/services';
import { staggerClass } from '@/components/common/motion';
import { cn } from '@/lib/utils';

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
    <div className="space-y-10">
      <SectionHeader
        eyebrow="Classe de ativo"
        title="Ações e FIIs"
        highlight="Ações"
        description="Cotações da B3, e a sua posição quando houver."
      />

      <section className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', staggerClass)}>
        <StatCard label="Sua posição" tone="equity" value={<Readout value={total} />} />
        <StatCard
          label="Resultado acumulado"
          tone="equity"
          value={positions.length > 0 ? <Readout value={total - invested} /> : '—'}
          hint={
            positions.length > 0 ? (
              <TrendValue value={percentChange(invested, total)} format="percent" />
            ) : undefined
          }
        />
        <StatCard
          label="Maior alta do dia"
          tone="equity"
          value={best?.ticker ?? '—'}
          hint={
            best?.changePercent != null ? (
              <TrendValue value={best.changePercent} format="percent" />
            ) : undefined
          }
        />
        <StatCard
          label="Ativos acompanhados"
          tone="equity"
          value={<Readout value={market.length} format="integer" />}
        />
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
