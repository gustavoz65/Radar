import { formatDateTime } from '@/lib/format/date';
import type { SyncStatus as SyncStatusData } from '@/lib/types';

/** Shows what the numbers on screen came from, and warns when the last attempt did not succeed. */
export function SyncStatus({ status }: { status: SyncStatusData }) {
  if (status.status === null) {
    return <p className="text-xs text-muted">Nunca sincronizado.</p>;
  }

  return (
    <div className="space-y-1 sm:text-right">
      <p className="text-xs text-muted">
        {status.lastSuccessfulAt
          ? `Última atualização: ${formatDateTime(status.lastSuccessfulAt)}`
          : 'Nenhuma sincronização concluída ainda.'}
      </p>
      {status.status !== 'success' && status.error ? (
        <p className="max-w-sm text-xs text-negative">{status.error}</p>
      ) : null}
    </div>
  );
}
