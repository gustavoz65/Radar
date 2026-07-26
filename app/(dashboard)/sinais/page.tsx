import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { EmptyState } from '@/components/common/empty-state';
import { SignalCard } from '@/components/signal/signal-card';
import { getSignals } from '@/lib/data/services';

export default async function SinaisPage() {
  const signals = await getSignals();

  if (signals.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Análise e sinais" />
        <EmptyState
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
    <div className="space-y-8">
      <SectionHeader
        title="Análise e sinais"
        description="Cenários identificados a partir dos indicadores, do histórico de mercado e das notícias. Cada score vem com os fatores que o compõem."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cenários ativos" value={String(signals.length)} />
        <StatCard label="Score médio" value={String(average)} />
        <StatCard label="Maior confiança" value={String(highest.score)} hint={highest.title} />
      </section>

      <section className="space-y-4">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} href={`/sinais/${signal.id}`} />
        ))}
      </section>
    </div>
  );
}
