import { formatBRL } from '@/lib/format/money';
import { formatSignedPercent } from '@/lib/format/percent';
import { cn } from '@/lib/utils';

interface TrendValueProps {
  value: number;
  format: 'percent' | 'currency';
  className?: string;
}

/** Price movement uses --positive/--negative only. Never the signature gold. */
export function TrendValue({ value, format, className }: TrendValueProps) {
  const text =
    format === 'percent'
      ? formatSignedPercent(value)
      : `${value > 0 ? '+' : ''}${formatBRL(value)}`;

  return (
    <span
      className={cn(
        'tabular font-mono',
        value > 0 && 'text-positive',
        value < 0 && 'text-negative',
        value === 0 && 'text-muted',
        className,
      )}
    >
      {text}
    </span>
  );
}
