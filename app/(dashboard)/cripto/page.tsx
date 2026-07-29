import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { CryptoPositionCard } from '@/components/crypto/crypto-position-card';
import { formatBRL } from '@/lib/format/money';
import { percentChange } from '@/lib/format/percent';
import { getCryptoPositions } from '@/lib/data/services';

export default async function CriptoPage() {
  const positions = await getCryptoPositions();

  if (positions.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Cripto" />
        <EmptyState
          title="Nenhuma posição em cripto por enquanto"
          description="A Pierre não expõe carteira de investimentos, então cripto é cadastrada em Posições. Depois disso a cotação em BRL e a variação de 24h passam a ser buscadas a cada atualização."
        />
      </div>
    );
  }

  const total = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const invested = positions.reduce((sum, position) => sum + position.investedValue, 0);
  const best = positions.reduce((top, position) =>
    position.change24h > top.change24h ? position : top,
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Cripto"
        description="Carteira de ativos digitais com preço em BRL e série dos últimos 90 dias."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total em cripto" value={formatBRL(total)} />
        <StatCard
          label="Resultado acumulado"
          value={formatBRL(total - invested)}
          hint={<TrendValue value={percentChange(invested, total)} format="percent" />}
        />
        <StatCard
          label="Melhor desempenho em 24h"
          value={best.symbol}
          hint={<TrendValue value={best.change24h} format="percent" />}
        />
        <StatCard label="Ativos" value={String(positions.length)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {positions.map((position) => (
          <CryptoPositionCard key={position.id} position={position} />
        ))}
      </section>
    </div>
  );
}
