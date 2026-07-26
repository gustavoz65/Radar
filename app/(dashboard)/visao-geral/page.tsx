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

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-4 text-sm uppercase tracking-wider text-muted">
            Evolução do patrimônio · 12 meses
          </h2>
          <AreaHistoryChart data={summary.history} />
        </div>
        <Link
          href="/sinais"
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <h2 className="text-sm uppercase tracking-wider text-muted">Score médio da carteira</h2>
          <ConfidenceGauge score={summary.averageScore} size="large" />
          <p className="text-center text-xs leading-relaxed text-muted">
            Média de {signals.length} sinais ativos.{' '}
            <span className="text-accent hover:underline">Veja os fatores de cada um.</span> Não é
            recomendação de compra.
          </p>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-4 text-sm uppercase tracking-wider text-muted">
            Alocação por classe de ativo
          </h2>
          <AllocationChart slices={summary.allocation} />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-muted">Contas conectadas</h2>
          <AccountsList accounts={accounts} />
        </div>
      </section>
    </div>
  );
}
