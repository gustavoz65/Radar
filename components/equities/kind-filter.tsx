'use client';

import { useState } from 'react';
import type { EquityPosition } from '@/lib/types';
import { EquitiesTable } from './equities-table';
import { cn } from '@/lib/utils';

type Kind = 'todos' | 'acao' | 'fii';

const options: { value: Kind; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'acao', label: 'Ações' },
  { value: 'fii', label: 'FIIs' },
];

export function KindFilter({ positions }: { positions: EquityPosition[] }) {
  const [kind, setKind] = useState<Kind>('todos');
  const filtered = kind === 'todos' ? positions : positions.filter((p) => p.kind === kind);

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Filtrar por tipo de ativo" className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={kind === option.value}
            onClick={() => setKind(option.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              kind === option.value
                ? 'bg-surface text-text'
                : 'text-muted hover:bg-surface/60 hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <EquitiesTable positions={filtered} />
    </div>
  );
}
