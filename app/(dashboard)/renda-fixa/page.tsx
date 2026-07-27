import { BarComparisonChart, type ComparisonBar } from '@/components/charts/bar-comparison-chart';
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { FixedIncomeTable } from '@/components/fixed-income/fixed-income-table';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';
import { getFixedIncomePositions, getMarketRates } from '@/lib/data/services';
import { SubsectionTitle } from '@/components/common/typography';
import { surfaceCardClass } from '@/components/common/surface';

export default async function RendaFixaPage() {
  const [positions, rates] = await Promise.all([getFixedIncomePositions(), getMarketRates()]);

  if (positions.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Renda fixa" />
        <EmptyState
          title="Nenhum título de renda fixa por aqui ainda"
          description="Assim que uma aplicação aparecer nas contas conectadas, ela entra nesta lista com a comparação frente ao CDI."
        />
      </div>
    );
  }

  const total = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const invested = positions.reduce((sum, position) => sum + position.investedValue, 0);
  const weightedRate =
    positions.reduce((sum, p) => sum + p.effectiveAnnualRate * p.currentValue, 0) / total;

  const comparison: ComparisonBar[] = [
    ...positions.map((position) => ({
      label: position.name,
      value: position.effectiveAnnualRate,
      highlight: true,
    })),
    { label: 'CDI', value: rates.cdi },
    { label: 'Selic', value: rates.selic },
    { label: 'Poupança', value: rates.poupanca },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Renda fixa"
        description={`Comparação frente aos indicadores de referência — Selic ${formatPercent(rates.selic)} a.a. e CDI ${formatPercent(rates.cdi)} a.a.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total em renda fixa" value={formatBRL(total)} />
        <StatCard
          label="Rentabilidade acumulada"
          value={formatBRL(total - invested)}
          hint={<TrendValue value={percentChange(invested, total)} format="percent" />}
        />
        <StatCard label="Taxa média ponderada" value={`${formatPercent(weightedRate)} a.a.`} />
        <StatCard label="Títulos" value={String(positions.length)} />
      </section>

      <section className="space-y-3">
        <SubsectionTitle>Posições</SubsectionTitle>
        <FixedIncomeTable positions={positions} />
      </section>

      <section className={surfaceCardClass}>
        <SubsectionTitle className="mb-4 block">
          Taxa equivalente a.a. vs. indicadores
        </SubsectionTitle>
        <BarComparisonChart data={comparison} height={340} />
      </section>
    </div>
  );
}
