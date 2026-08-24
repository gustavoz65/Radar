'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { primaryActionClass } from '@/components/common/action';
import { cn } from '@/lib/utils';

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
        className={cn(primaryActionClass, 'relative overflow-hidden')}
      >
        {pending ? 'Sincronizando…' : 'Atualizar agora'}
        {/* A sync hits several external APIs in sequence and has no progress to
            report, so the button scans rather than pretending to fill. */}
        {pending ? (
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
            <span className="animate-scan block h-full w-1/4 bg-bg/60" />
          </span>
        ) : null}
      </button>
      {error ? (
        <p role="alert" className="max-w-xs text-xs text-negative">
          {error}
        </p>
      ) : null}
    </div>
  );
}
