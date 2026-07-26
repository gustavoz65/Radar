'use client';

import { useState } from 'react';
import { AreaHistoryChart } from '@/components/charts/area-history-chart';
import { StatCard } from '@/components/common/stat-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBRL } from '@/lib/format/money';
import { formatPercent } from '@/lib/format/percent';
import { futureValue, projectionSeries } from '@/lib/tools/projection';

export function ContributionSimulator({ defaultAnnualRate }: { defaultAnnualRate: number }) {
  const [initial, setInitial] = useState(20000);
  const [monthlyContribution, setMonthlyContribution] = useState(1500);
  const [years, setYears] = useState(10);
  const [annualRatePercent, setAnnualRatePercent] = useState(defaultAnnualRate);

  const months = years * 12;
  const options = { initial, monthlyContribution, annualRatePercent, months };
  const total = futureValue(options);
  const contributed = initial + monthlyContribution * months;
  const series = projectionSeries(options);

  return (
    <section className="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <h2 className="text-base font-medium text-text">Simulador de aporte mensal</h2>
        <p className="mt-1 text-sm text-muted">
          Projeção com taxa constante e aportes no fim de cada mês. Cenário ilustrativo, não é
          recomendação de compra.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="sim-initial" className="text-xs uppercase tracking-wider text-muted">
            Valor inicial
          </Label>
          <Input
            id="sim-initial"
            type="number"
            min={0}
            step={500}
            value={initial}
            onChange={(event) => setInitial(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-monthly" className="text-xs uppercase tracking-wider text-muted">
            Aporte mensal
          </Label>
          <Input
            id="sim-monthly"
            type="number"
            min={0}
            step={100}
            value={monthlyContribution}
            onChange={(event) => setMonthlyContribution(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-years" className="text-xs uppercase tracking-wider text-muted">
            Prazo (anos)
          </Label>
          <Input
            id="sim-years"
            type="number"
            min={1}
            max={40}
            value={years}
            onChange={(event) => setYears(Math.max(1, Number(event.target.value) || 1))}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-rate" className="text-xs uppercase tracking-wider text-muted">
            Taxa a.a. (%)
          </Label>
          <Input
            id="sim-rate"
            type="number"
            min={0}
            max={100}
            step={0.05}
            value={annualRatePercent}
            onChange={(event) => setAnnualRatePercent(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Patrimônio projetado" value={formatBRL(total)} />
        <StatCard label="Total aportado" value={formatBRL(contributed)} />
        <StatCard
          label="Juros acumulados"
          value={formatBRL(total - contributed)}
          hint={
            <span className="text-muted">
              {formatPercent(contributed > 0 ? ((total - contributed) / contributed) * 100 : 0, 1)}{' '}
              sobre o aportado
            </span>
          }
        />
      </div>

      <AreaHistoryChart data={series} color="var(--accent)" height={260} />
    </section>
  );
}
