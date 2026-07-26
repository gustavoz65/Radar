'use client';

import { useState } from 'react';
import type { NewsCategory, NewsItem } from '@/lib/types';
import { EmptyState } from '@/components/common/empty-state';
import { formatDateTime } from '@/lib/format/date';
import { cn } from '@/lib/utils';

type Filter = 'todas' | NewsCategory;

const filters: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'selic', label: 'Selic e Copom' },
  { value: 'cripto', label: 'Cripto' },
  { value: 'acoes', label: 'Ações' },
  { value: 'bancos', label: 'Bancos' },
];

const categoryLabels: Record<NewsCategory, string> = {
  selic: 'Selic e Copom',
  cripto: 'Cripto',
  acoes: 'Ações',
  bancos: 'Bancos',
};

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [filter, setFilter] = useState<Filter>('todas');
  const visible = filter === 'todas' ? items : items.filter((item) => item.category === filter);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
              filter === option.value
                ? 'bg-surface text-text'
                : 'text-muted hover:bg-surface/60 hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nada nesta categoria por enquanto"
          description="Troque o filtro ou volte mais tarde — o feed é atualizado ao longo do dia."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded border border-border px-2 py-0.5 uppercase tracking-wider">
                  {categoryLabels[item.category]}
                </span>
                <span>{item.source}</span>
                <span aria-hidden>·</span>
                <time dateTime={item.publishedAt} className="tabular font-mono">
                  {formatDateTime(item.publishedAt)}
                </time>
              </div>
              <h2 className="mt-2 text-base leading-snug font-medium text-text">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
