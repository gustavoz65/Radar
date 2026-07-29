import { describe, expect, it } from 'vitest';
import { effectiveAnnualRate } from '@/lib/market/rates';
import type { MarketRates } from '@/lib/types';

const rates: MarketRates = {
  selic: 14.25,
  cdi: 14.15,
  ipca12m: 4.64,
  poupanca: 8.4,
  updatedAt: '2026-07-28T00:00:00.000Z',
};

describe('effectiveAnnualRate', () => {
  it('resolves a percentage of the CDI', () => {
    // The Mercado Pago caixinha: 120% of a 14.15% CDI.
    expect(effectiveAnnualRate('120% do CDI', rates)).toBe(16.98);
  });

  it('resolves a percentage of the Selic', () => {
    expect(effectiveAnnualRate('100% da Selic', rates)).toBe(14.25);
  });

  it('resolves an inflation-linked rate', () => {
    expect(effectiveAnnualRate('IPCA + 6,20%', rates)).toBe(10.84);
  });

  it('resolves a pre-fixed rate', () => {
    expect(effectiveAnnualRate('12,5% a.a.', rates)).toBe(12.5);
  });

  it('is null when the indicator has not been collected yet', () => {
    expect(effectiveAnnualRate('120% do CDI', null)).toBeNull();
  });

  it('is null for a label it cannot read, never a zero', () => {
    expect(effectiveAnnualRate('rende bastante', rates)).toBeNull();
    expect(effectiveAnnualRate(null, rates)).toBeNull();
  });
});
