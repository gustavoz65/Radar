import type { CryptoPosition } from '@/lib/types';
import { AreaHistoryChart } from '@/components/charts/area-history-chart';
import { TrendValue } from '@/components/common/trend-value';
import { formatBRL } from '@/lib/format/money';
import { percentChange } from '@/lib/format/percent';
import { instrumentCardClass, interactiveSurfaceClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';

const quantityFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });

export function CryptoPositionCard({ position }: { position: CryptoPosition }) {
  const totalReturn = percentChange(position.investedValue, position.currentValue);
  const trendColor = totalReturn >= 0 ? 'var(--positive)' : 'var(--negative)';

  return (
    <article className={cn(instrumentCardClass, interactiveSurfaceClass)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-semibold tracking-[0.02em] text-text">
              {position.symbol}
            </span>
            <span className="text-sm text-muted">{position.name}</span>
          </div>
          <p className="tabular mt-1 font-mono text-xs text-muted">
            {quantityFormatter.format(position.quantity)} {position.symbol} ·{' '}
            {formatBRL(position.priceBrl)}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular font-mono text-lg tracking-[-0.01em] text-text">
            {formatBRL(position.currentValue)}
          </p>
          <p className="text-sm">
            <TrendValue value={position.change24h} format="percent" className="text-sm" />
            <span className="ml-1.5 text-xs text-muted">24h</span>
          </p>
        </div>
      </header>

      <div className="mt-4">
        <AreaHistoryChart data={position.history} color={trendColor} height={180} />
      </div>

      <footer className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted">Resultado acumulado</span>
        <span className="flex items-baseline gap-2">
          <TrendValue
            value={position.currentValue - position.investedValue}
            format="currency"
            className="text-sm"
          />
          <TrendValue value={totalReturn} format="percent" className="text-xs" />
        </span>
      </footer>
    </article>
  );
}
