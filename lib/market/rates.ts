import type { MarketRates } from '@/lib/types';

/**
 * Turns a contracted-rate label into a comparable annual percentage, or null when
 * the format is unknown or the indicator has not been collected. Callers render a
 * dash for null, never a zero, because zero reads as "yields nothing".
 */
export function effectiveAnnualRate(
  rateLabel: string | null,
  rates: MarketRates | null,
): number | null {
  if (!rateLabel) return null;

  // Whitespace is collapsed once so the patterns below need only a single
  // optional space, which keeps them free of backtracking ambiguity.
  const label = rateLabel.trim().toLowerCase().replace(',', '.').replace(/\s+/g, ' ');

  const postFixed = /^(\d+(?:\.\d+)?) ?%? ?d[aoe] ?(cdi|selic)$/.exec(label);
  if (postFixed) {
    const indicator = postFixed[2] === 'cdi' ? rates?.cdi : rates?.selic;
    if (!indicator) return null;
    return round((indicator * Number(postFixed[1])) / 100);
  }

  const inflationLinked = /^(ipca|igpm) ?\+ ?(\d+(?:\.\d+)?) ?%?/.exec(label);
  if (inflationLinked) {
    if (!rates?.ipca12m) return null;
    return round(rates.ipca12m + Number(inflationLinked[2]));
  }

  const preFixed = /^(\d+(?:\.\d+)?) ?% ?a\.? ?a\.?$/.exec(label);
  if (preFixed) return round(Number(preFixed[1]));

  return null;
}

function round(value: number): number | null {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
}
