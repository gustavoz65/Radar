import { getSignals } from '@/lib/data/services';
import { SignalCard } from '@/components/signal/signal-card';

export default async function SinaisPage() {
  const signals = await getSignals();
  return (
    <div className="space-y-4">
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
