'use client';

import { useState } from 'react';
import { BarComparisonChart, type ComparisonBar } from '@/components/charts/bar-comparison-chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBRL } from '@/lib/format/money';
import { PanelTitle, dataLabelClass } from '@/components/common/typography';
import { surfaceCardClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';
import { formatPercent } from '@/lib/format/percent';
import { futureValue } from '@/lib/tools/projection';

interface CdbComparatorProps {
  cdi: number;
  selic: number;
  poupanca: number;
}

export function CdbComparator({ cdi, selic, poupanca }: CdbComparatorProps) {
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(24);
  const [cdiPercent, setCdiPercent] = useState(110);

  const options = [
    { label: `CDB ${cdiPercent}% do CDI`, rate: (cdi * cdiPercent) / 100, highlight: true },
    { label: 'Tesouro Selic', rate: selic + 0.08 },
    { label: 'Poupança', rate: poupanca },
  ];

  const bars: ComparisonBar[] = options.map((option) => ({
    label: option.label,
    value: option.rate,
    highlight: option.highlight,
  }));

  return (
    <section className={cn('space-y-5', surfaceCardClass)}>
      <div>
        <PanelTitle>Comparador CDB × Tesouro × poupança</PanelTitle>
        <p className="mt-1 text-sm text-muted">
          Comparação bruta de taxas, sem imposto de renda. Não é recomendação de compra.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cdb-amount" className={dataLabelClass}>
            Valor aplicado
          </Label>
          <Input
            id="cdb-amount"
            type="number"
            min={0}
            step={100}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdb-months" className={dataLabelClass}>
            Prazo (meses)
          </Label>
          <Input
            id="cdb-months"
            type="number"
            min={1}
            max={360}
            value={months}
            onChange={(event) => setMonths(Math.max(1, Number(event.target.value) || 1))}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdb-percent" className={dataLabelClass}>
            % do CDI
          </Label>
          <Input
            id="cdb-percent"
            type="number"
            min={1}
            max={200}
            value={cdiPercent}
            onChange={(event) => setCdiPercent(Math.max(1, Number(event.target.value) || 1))}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
      </div>

      <BarComparisonChart data={bars} height={200} />

      <ul className="divide-y divide-border rounded-md border border-border">
        {options.map((option) => {
          const result = futureValue({
            initial: amount,
            monthlyContribution: 0,
            annualRatePercent: option.rate,
            months,
          });
          return (
            <li key={option.label} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm text-text">{option.label}</p>
                <p className="tabular font-mono text-xs text-muted">
                  {formatPercent(option.rate)} a.a.
                </p>
              </div>
              <div className="text-right">
                <p className="tabular font-mono text-sm text-text">{formatBRL(result)}</p>
                <p className="tabular font-mono text-xs text-muted">
                  +{formatBRL(result - amount)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
