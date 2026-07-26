'use client';

import { useState } from 'react';
import type { EquityPosition } from '@/lib/types';
import { EquitiesTable } from './equities-table';
import { FilterGroup } from '@/components/common/filter-group';

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
      {/* Plain button group, not a tab widget: no tabpanel/aria-controls or roving
          tabindex is implemented, so a tablist role would promise more than this
          delivers. aria-pressed + native button semantics keep it honest and
          keyboard-accessible. Shares FilterGroup with the Notícias category filter. */}
      <FilterGroup
        options={options}
        value={kind}
        onChange={setKind}
        label="Filtrar por tipo de ativo"
        className="flex gap-1"
      />
      <EquitiesTable positions={filtered} />
    </div>
  );
}
