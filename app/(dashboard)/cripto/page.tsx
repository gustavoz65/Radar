import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { Readout } from '@/components/common/readout';
import { TrendValue } from '@/components/common/trend-value';
import { SubsectionTitle } from '@/components/common/typography';
import { CryptoPositionCard } from '@/components/crypto/crypto-position-card';
import { MarketQuotesTable } from '@/components/market/market-quotes-table';
import { percentChange } from '@/lib/format/percent';
import { getCryptoMarket, getCryptoPositions } from '@/lib/data/services';
import { staggerClass } from '@/components/common/motion';
import { cn } from '@/lib/utils';

export default async function CriptoPage() {
  const [positions, market] = await Promise.all([getCryptoPositions(), getCryptoMarket()]);

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
        title="Cripto"
        highlight="Cripto"
        description="Cotações em BRL do mercado, e a sua posição quando houver."
      />

      <section className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', staggerClass)}>
        <StatCard label="Sua posição" tone="crypto" value={<Readout value={total} />} />
        <StatCard
          label="Resultado acumulado"
          tone="crypto"
          value={positions.length > 0 ? <Readout value={total - invested} /> : '—'}
          hint={
            positions.length > 0 ? (
              <TrendValue value={percentChange(invested, total)} format="percent" />
            ) : undefined
          }
        />
        <StatCard
          label="Melhor em 24h"
          tone="crypto"
          value={best?.ticker ?? '—'}
          hint={
            best?.changePercent != null ? (
              <TrendValue value={best.changePercent} format="percent" />
            ) : undefined
          }
        />
        <StatCard
          label="Ativos acompanhados"
          tone="crypto"
          value={<Readout value={market.length} format="integer" />}
        />
      </section>

      <section className="space-y-3">
        <SubsectionTitle>Mercado</SubsectionTitle>
        <MarketQuotesTable
          quotes={market}
          emptyDescription='Clique em "Atualizar agora" na visão geral para buscar as cotações na Binance.'
        />
      </section>

      {positions.length > 0 ? (
        <section className="space-y-3">
          <SubsectionTitle>Sua carteira</SubsectionTitle>
          <div className={cn('grid gap-4 xl:grid-cols-2', staggerClass)}>
            {positions.map((position) => (
              <CryptoPositionCard key={position.id} position={position} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
