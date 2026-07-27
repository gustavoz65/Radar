'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/common/data-table';
import { PositionForm } from '@/components/positions/position-form';
import { formatBRL } from '@/lib/format/money';
import type { AssetClass, Position } from '@/lib/types';

const assetClassLabels: Record<AssetClass, string> = {
  rendaFixa: 'Renda fixa',
  cripto: 'Cripto',
  acoes: 'Ações e FIIs',
};

/** Crypto quantities are fractional; a share count is not. */
function formatQuantity(quantity: number): string {
  return quantity % 1 === 0 ? String(quantity) : quantity.toFixed(8).replace(/0+$/, '');
}

export function PositionsTable({ positions }: { positions: Position[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Position | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(position: Position) {
    if (!window.confirm(`Excluir "${position.name}"? Esta ação não pode ser desfeita.`)) return;

    setDeletingId(position.id);
    try {
      const response = await fetch(`/api/positions/${position.id}`, { method: 'DELETE' });
      if (response.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<Position>[] = [
    {
      key: 'name',
      header: 'Posição',
      cell: (position) => (
        <div>
          <p className="text-text">{position.name}</p>
          <p className="text-xs text-muted">{assetClassLabels[position.assetClass]}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      align: 'right',
      cell: (position) => (
        <span className="tabular font-mono">{formatQuantity(position.quantity)}</span>
      ),
    },
    {
      key: 'unitValue',
      header: 'Valor unitário',
      align: 'right',
      cell: (position) => (
        <span className="tabular font-mono">
          {formatBRL(position.quantity === 0 ? 0 : position.currentValue / position.quantity)}
        </span>
      ),
    },
    {
      key: 'currentValue',
      header: 'Valor atual',
      align: 'right',
      cell: (position) => (
        <span className="tabular font-mono">{formatBRL(position.currentValue)}</span>
      ),
    },
    {
      key: 'investedValue',
      header: 'Investido',
      align: 'right',
      cell: (position) => (
        <span className="tabular font-mono">{formatBRL(position.investedValue)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      cell: (position) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(position)}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-text"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(position)}
            disabled={deletingId === position.id}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-negative disabled:opacity-60"
          >
            {deletingId === position.id ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {editing ? (
        <PositionForm key={editing.id} position={editing} onFinished={() => setEditing(null)} />
      ) : null}

      <DataTable columns={columns} rows={positions} rowKey={(position) => position.id} />
    </div>
  );
}
