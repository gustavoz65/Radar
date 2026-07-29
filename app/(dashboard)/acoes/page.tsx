import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { KindFilter } from '@/components/equities/kind-filter';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';
import { getEquityPositions } from '@/lib/data/services';

export default async function AcoesPage() {
  const positions = await getEquityPositions();

  if (positions.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Ações e FIIs" />
        <EmptyState
          title="Nenhuma posição em renda variável ainda"
          description="A Pierre não expõe carteira de investimentos, então ações e FIIs são cadastrados em Posições. Depois disso a cotação da B3 passa a ser buscada a cada atualização."
        />
      </div>
    );
  }

  const total = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const invested = positions.reduce((sum, position) => sum + position.investedValue, 0);
  const weightedDy =
    positions.reduce((sum, p) => sum + p.dividendYield * p.currentValue, 0) / total;
  const dayChange = positions.reduce((sum, p) => sum + p.changeDay * p.currentValue, 0) / total;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Ações e FIIs"
        description="Carteira de renda variável com desempenho acumulado e dividend yield."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total em renda variável" value={formatBRL(total)} />
        <StatCard
          label="Resultado acumulado"
          value={formatBRL(total - invested)}
          hint={<TrendValue value={percentChange(invested, total)} format="percent" />}
        />
        <StatCard
          label="Variação do dia"
          value={formatBRL((total * dayChange) / 100)}
          hint={<TrendValue value={dayChange} format="percent" />}
        />
        <StatCard label="DY médio ponderado" value={`${formatPercent(weightedDy, 1)} a.a.`} />
      </section>

      <section>
        <KindFilter positions={positions} />
      </section>
    </div>
  );
}
