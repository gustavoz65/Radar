'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SyncButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? 'Não foi possível sincronizar.');
        return;
      }

      // A partial sync wrote data; its warning belongs to SyncStatus, which the
      // refresh re-renders. Repeating it here showed the same text twice.
      router.refresh();
    } catch {
      setError('Não foi possível alcançar o servidor.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={pending}
        aria-busy={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
      >
        {pending ? 'Sincronizando…' : 'Atualizar agora'}
      </button>
      {error ? (
        <p role="alert" className="max-w-xs text-xs text-negative">
          {error}
        </p>
      ) : null}
    </div>
  );
}
