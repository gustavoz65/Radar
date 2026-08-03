import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { Readout } from '@/components/common/readout';
import { EmptyState } from '@/components/common/empty-state';
import { SignalCard } from '@/components/signal/signal-card';
import { getSignals } from '@/lib/data/services';
import { staggerClass } from '@/components/common/motion';
import { cn } from '@/lib/utils';

export default async function SinaisPage() {
  const signals = await getSignals();

  if (signals.length === 0) {
    return (
      <div className="space-y-10">
        <SectionHeader eyebrow="Motor de score" title="Análise e sinais" highlight="sinais" />
        <EmptyState
          label="Nenhum cenário"
          title="Nenhum cenário relevante no momento"
          description="O radar continua acompanhando juros, cripto e renda variável. Assim que um cenário se formar, ele aparece aqui com o score e os fatores por trás dele."
        />
      </div>
    );
  }

  const average = Math.round(
    signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length,
  );
  const highest = signals.reduce((top, signal) => (signal.score > top.score ? signal : top));

  return (
    <div className="space-y-10">
      <SectionHeader
        eyebrow="Motor de score"
        title="Análise e sinais"
        highlight="sinais"
        description="Cenários identificados a partir dos indicadores, do histórico de mercado e das notícias. Cada score vem com os fatores que o compõem."
      />

      <section className={cn('grid gap-4 sm:grid-cols-3', staggerClass)}>
        <StatCard
          label="Cenários ativos"
          value={<Readout value={signals.length} format="integer" />}
        />
        <StatCard
          label="Score médio"
          tone="score"
          value={<Readout value={average} format="integer" />}
        />
        <StatCard
          label="Maior confiança"
          tone="score"
          value={<Readout value={highest.score} format="integer" />}
          hint={highest.title}
        />
      </section>

      <section className={cn('space-y-4', staggerClass)}>
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} href={`/sinais/${signal.id}`} />
        ))}
      </section>
    </div>
  );
}
