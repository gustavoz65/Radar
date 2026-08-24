import { formatDateTime } from '@/lib/format/date';
import type { SyncStatus as SyncStatusData } from '@/lib/types';

/**
 * Shows what the numbers on screen came from, and warns when the last attempt
 * did not succeed. The dot is the app's one live-status affordance: green means
 * the figures above it are the ones the last successful sync wrote.
 */
export function SyncStatus({ status }: { status: SyncStatusData }) {
  if (status.status === null) {
    return (
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
        Nunca sincronizado
      </p>
    );
  }

  const healthy = status.status === 'success';

  return (
    <div className="space-y-1 sm:text-right">
      <p className="inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
        <span
          aria-hidden
          className={`size-1.5 rounded-full ${healthy ? 'animate-blip bg-positive' : 'bg-negative'}`}
        />
        {status.lastSuccessfulAt
          ? `Leitura de ${formatDateTime(status.lastSuccessfulAt)}`
          : 'Nenhuma sincronização concluída'}
      </p>
      {!healthy && status.error ? (
        <p className="max-w-sm text-xs text-negative">{status.error}</p>
      ) : null}
    </div>
  );
}
