import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AllocationChart } from '@/components/charts/allocation-chart';
import { AreaHistoryChart } from '@/components/charts/area-history-chart';
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { Readout } from '@/components/common/readout';
import { TrendValue } from '@/components/common/trend-value';
import { AccountsList, CreditCardsList } from '@/components/overview/accounts-list';
import { ConfidenceGauge } from '@/components/signal/confidence-gauge';
import { formatBRL } from '@/lib/format/money';
import {
  getAccounts,
  getInstallmentCommitment,
  getPortfolioSummary,
  getSignals,
  getSyncStatus,
} from '@/lib/data/services';
import { SyncButton } from '@/components/sync/sync-button';
import { SyncStatus } from '@/components/sync/sync-status';
import { SubsectionTitle } from '@/components/common/typography';
import { instrumentCardClass, surfaceCardClass } from '@/components/common/surface';
import { staggerClass } from '@/components/common/motion';
import { cn } from '@/lib/utils';

export default async function VisaoGeralPage() {
  const [summary, accounts, signals, syncStatus, installments] = await Promise.all([
    getPortfolioSummary(),
    getAccounts(),
    getSignals(),
    getSyncStatus(),
    getInstallmentCommitment(),
  ]);
  const investedTotal = summary.allocation.reduce((total, slice) => total + slice.value, 0);

  // A card's balance is a bill, so it never shares a list with cash balances.
  const creditCards = accounts.filter((account) => account.type === 'credito');
  const cashAccounts = accounts.filter((account) => account.type !== 'credito');

  return (
    <div className="space-y-10">
      <SectionHeader
        eyebrow="Painel · consolidado"
        title="Visão geral"
        highlight="geral"
        description="Patrimônio consolidado a partir das contas conectadas via Open Finance."
        actions={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <SyncButton />
            <SyncStatus status={syncStatus} />
          </div>
        }
      />

      <section className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', staggerClass)}>
        <StatCard label="Patrimônio total" value={<Readout value={summary.totalValue} />} />
        <StatCard
          label="Variação do dia"
          value={<Readout value={summary.dayChangeValue} />}
          hint={<TrendValue value={summary.dayChangePercent} format="percent" />}
        />
        <StatCard label="Total investido" value={<Readout value={investedTotal} />} />
        {/* Counts only cash accounts: calling 5 accounts and 3 cards "8 contas"
            reads as eight places holding money. Cards get their own line. */}
        <StatCard
          label="Contas conectadas"
          value={<Readout value={cashAccounts.length} format="integer" />}
          hint={
            creditCards.length > 0 ? (
              <span className="text-muted">
                {creditCards.length === 1 ? '+1 cartão' : `+${creditCards.length} cartões`}
              </span>
            ) : undefined
          }
        />
      </section>

      {/* Fluid proportions (fr): both columns are content and should grow with the
          screen — unlike the fixed px column on the signal detail screen, which is
          an identification panel of predictable size. */}
      <section className={cn('grid gap-6 lg:grid-cols-[2fr_1fr]', staggerClass)}>
        <div className={surfaceCardClass}>
          <SubsectionTitle className="mb-5 block">
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
            instrumentCardClass,
            'group flex flex-col items-center justify-center gap-3 transition-colors duration-(--dur-2) hover:border-border-strong',
          )}
        >
          <SubsectionTitle>Score médio da carteira</SubsectionTitle>
          <ConfidenceGauge score={summary.averageScore} size="large" />
          <p className="text-center text-sm leading-relaxed text-muted">
            Média de {signals.length} sinais ativos, cada um com os fatores que compõem o score.
          </p>
          <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-text transition-colors duration-(--dur-1) group-hover:border-accent group-hover:text-accent">
            Ver os fatores de cada sinal
            <ArrowRight
              className="size-3.5 transition-transform duration-(--dur-2) ease-(--ease-out-radar) group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
          <p className="text-center text-xs text-faint">Não é recomendação de compra.</p>
        </Link>
      </section>

      {/* items-start: the allocation card is as tall as its ring, and letting the
          grid stretch it to match the account lists leaves half a card of void. */}
      <section className={cn('grid items-start gap-6 lg:grid-cols-2', staggerClass)}>
        <div className={surfaceCardClass}>
          <SubsectionTitle className="mb-5 block">Alocação por classe de ativo</SubsectionTitle>
          <AllocationChart slices={summary.allocation} />
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <SubsectionTitle>Contas correntes</SubsectionTitle>
            <AccountsList accounts={cashAccounts} />
          </div>
          {creditCards.length > 0 ? (
            <div className="space-y-3">
              <SubsectionTitle>Cartões de crédito</SubsectionTitle>
              <CreditCardsList accounts={creditCards} />
              {installments && installments.amountRemaining > 0 ? (
                <p className="text-xs text-muted">
                  Parcelas a vencer: {formatBRL(installments.amountRemaining)} em{' '}
                  {installments.purchases} compra(s), {installments.installmentsRemaining}{' '}
                  parcela(s) restante(s) — dinheiro já comprometido.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
