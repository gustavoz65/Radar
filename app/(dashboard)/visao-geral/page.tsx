import Link from 'next/link';
import { AllocationChart } from '@/components/charts/allocation-chart';
import { AreaHistoryChart } from '@/components/charts/area-history-chart';
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { AccountsList } from '@/components/overview/accounts-list';
import { ConfidenceGauge } from '@/components/signal/confidence-gauge';
import { formatBRL } from '@/lib/format/money';
import { getAccounts, getPortfolioSummary, getSignals } from '@/lib/data/services';
import { SubsectionTitle } from '@/components/common/typography';
import { surfaceCardClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';

export default async function VisaoGeralPage() {
  const [summary, accounts, signals] = await Promise.all([
    getPortfolioSummary(),
    getAccounts(),
    getSignals(),
  ]);
  const investedTotal = summary.allocation.reduce((total, slice) => total + slice.value, 0);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Visão geral"
        description="Patrimônio consolidado a partir das contas conectadas via Open Finance."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patrimônio total" value={formatBRL(summary.totalValue)} />
        <StatCard
          label="Variação do dia"
          value={formatBRL(summary.dayChangeValue)}
          hint={<TrendValue value={summary.dayChangePercent} format="percent" />}
        />
        <StatCard label="Total investido" value={formatBRL(investedTotal)} />
        <StatCard label="Contas conectadas" value={String(accounts.length)} />
      </section>

      {/* Fluid proportions (fr): both columns are content and should grow with the
          screen — unlike the fixed px column on the signal detail screen, which is
          an identification panel of predictable size. */}
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className={surfaceCardClass}>
          <SubsectionTitle className="mb-4 block">
            Evolução do patrimônio · 12 meses
          </SubsectionTitle>
          <AreaHistoryChart data={summary.history} />
        </div>
        {/* The whole card is the link — which is why the CTA below is a `<span>`
            carrying its own visual weight, rather than an underlined run of text
            mid-paragraph (which would suggest only that bit is clickable). */}
        <Link
          href="/sinais"
          className={cn(
            'group flex flex-col items-center justify-center gap-3 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            surfaceCardClass,
          )}
        >
          <SubsectionTitle>Score médio da carteira</SubsectionTitle>
          <ConfidenceGauge score={summary.averageScore} size="large" />
          <p className="text-center text-sm leading-relaxed text-text">
            Média de {signals.length} sinais ativos, cada um com os fatores que compõem o score.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 px-3 py-2 text-sm font-medium text-accent transition-colors group-hover:border-accent group-hover:bg-accent/10">
            Ver os fatores de cada sinal
            <span aria-hidden>→</span>
          </span>
          <p className="text-center text-xs text-muted">Não é recomendação de compra.</p>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={surfaceCardClass}>
          <SubsectionTitle className="mb-4 block">Alocação por classe de ativo</SubsectionTitle>
          <AllocationChart slices={summary.allocation} />
        </div>
        <div className="space-y-3">
          <SubsectionTitle>Contas conectadas</SubsectionTitle>
          <AccountsList accounts={accounts} />
        </div>
      </section>
    </div>
  );
}
