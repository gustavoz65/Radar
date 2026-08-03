'use client';

import { useState } from 'react';
import type { NewsCategory, NewsItem } from '@/lib/types';
import { EmptyState } from '@/components/common/empty-state';
import { FilterGroup } from '@/components/common/filter-group';
import { formatDateTime } from '@/lib/format/date';
import { PanelTitle, dataLabelClass } from '@/components/common/typography';
import { interactiveSurfaceClass, surfaceCardClass } from '@/components/common/surface';
import { staggerClass } from '@/components/common/motion';
import { cn } from '@/lib/utils';

type Filter = 'todas' | NewsCategory;

const filters: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'selic', label: 'Selic e Copom' },
  { value: 'cripto', label: 'Cripto' },
  { value: 'acoes', label: 'Ações' },
  { value: 'bancos', label: 'Bancos' },
  { value: 'mercado', label: 'Mercado' },
];

const categoryLabels: Record<NewsCategory, string> = {
  selic: 'Selic e Copom',
  cripto: 'Cripto',
  acoes: 'Ações',
  bancos: 'Bancos',
  mercado: 'Mercado',
};

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [filter, setFilter] = useState<Filter>('todas');
  const visible = filter === 'todas' ? items : items.filter((item) => item.category === filter);

  return (
    <div className="space-y-4">
      <FilterGroup
        options={filters}
        value={filter}
        onChange={setFilter}
        label="Filtrar por categoria de notícia"
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        buttonClassName="shrink-0"
      />

      {visible.length === 0 ? (
        <EmptyState
          title="Nada nesta categoria por enquanto"
          description="Troque o filtro ou volte mais tarde — o feed é atualizado ao longo do dia."
        />
      ) : (
        <ul className={cn('space-y-3', staggerClass)}>
          {visible.map((item) => (
            <li key={item.id} className={cn(surfaceCardClass, interactiveSurfaceClass)}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={cn(dataLabelClass, 'rounded-sm bg-well px-2 py-1 text-text')}>
                  {categoryLabels[item.category]}
                </span>
                <span className="text-xs text-muted">{item.source}</span>
                <span aria-hidden className="text-faint">
                  ·
                </span>
                <time dateTime={item.publishedAt} className="tabular font-mono text-xs text-faint">
                  {formatDateTime(item.publishedAt)}
                </time>
              </div>
              <PanelTitle className="mt-3">{item.title}</PanelTitle>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
