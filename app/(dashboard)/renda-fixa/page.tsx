import { BarComparisonChart, type ComparisonBar } from '@/components/charts/bar-comparison-chart';
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { FixedIncomeTable } from '@/components/fixed-income/fixed-income-table';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';
import { formatDateTime } from '@/lib/format/date';
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

  // Only manual positions carry a real cost basis. A synced caixinha reports
  // what it holds today, never what was deposited, so counting it would render
  // a confident "R$ 0,00 / 0,00%" for a return nobody knows.
  const withCostBasis = positions.filter((position) => position.source === 'manual');
  const investedKnown = withCostBasis.reduce((sum, position) => sum + position.investedValue, 0);
  const currentKnown = withCostBasis.reduce((sum, position) => sum + position.currentValue, 0);
  const hasCostBasis = withCostBasis.length > 0;

  // Only titles Radar can actually price take part in the average and the chart.
  // A synced caixinha knows its contracted rate ("120% do CDI") but not the
  // equivalent annual figure, and treating that as 0 would drag the average down
  // and plot a bar claiming the money yields nothing.
  const priced = positions.filter(
    (position): position is typeof position & { effectiveAnnualRate: number } =>
      position.effectiveAnnualRate !== null,
  );
  const pricedTotal = priced.reduce((sum, position) => sum + position.currentValue, 0);
  const weightedRate =
    pricedTotal === 0
      ? null
      : priced.reduce((sum, p) => sum + p.effectiveAnnualRate * p.currentValue, 0) / pricedTotal;

  // Reference bars only when the BCB series have been collected; a 0% CDI bar
  // would be a claim about the economy, not a missing value.
  const benchmarks: ComparisonBar[] = rates
    ? [
        { label: 'CDI', value: rates.cdi },
        { label: 'Selic', value: rates.selic },
        { label: 'Poupança', value: rates.poupanca },
      ]
    : [];

  const comparison: ComparisonBar[] = [
    ...priced.map((position) => ({
      label: position.name,
      value: position.effectiveAnnualRate,
      highlight: true,
    })),
    ...benchmarks,
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Renda fixa"
        description={
          rates
            ? `Selic ${formatPercent(rates.selic)} a.a. (meta do Copom) e CDI ${formatPercent(rates.cdi)} a.a. (acumulado 12 meses), do Banco Central em ${formatDateTime(rates.updatedAt)}.`
            : 'Atualize para trazer Selic e CDI do Banco Central e comparar sua carteira.'
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total em renda fixa" value={formatBRL(total)} />
        <StatCard
          label="Rentabilidade acumulada"
          value={hasCostBasis ? formatBRL(currentKnown - investedKnown) : '—'}
          hint={
            hasCostBasis ? (
              <TrendValue value={percentChange(investedKnown, currentKnown)} format="percent" />
            ) : (
              <span className="text-muted">A Pierre não informa quanto foi depositado</span>
            )
          }
        />
        <StatCard
          label="Taxa média ponderada"
          value={weightedRate === null ? '—' : `${formatPercent(weightedRate)} a.a.`}
          hint={
            weightedRate === null ? (
              <span className="text-muted">Taxa equivalente ainda não calculada</span>
            ) : undefined
          }
        />
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
