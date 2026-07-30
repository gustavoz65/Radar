import { describe, expect, it } from 'vitest';
import { FGC_LIMIT, scoreFixedIncome, type ScoringInput } from '@/lib/scoring/fixed-income';
import type { FixedIncomePosition, MarketRates } from '@/lib/types';

const rates: MarketRates = {
  selic: 14.25,
  cdi: 14.15,
  ipca12m: 4.64,
  poupanca: 8.4,
  updatedAt: '2026-07-28T00:00:00.000Z',
};

function position(overrides: Partial<FixedIncomePosition> = {}): FixedIncomePosition {
  return {
    id: '1',
    assetClass: 'rendaFixa',
    name: 'Mercado Pago · Grana',
    institutionId: 'MERCADO_PAGO',
    quantity: 1,
    investedValue: 1258.17,
    currentValue: 1258.17,
    history: [],
    source: 'pierre',
    issuer: 'Mercado Pago',
    index: 'CDI',
    rateLabel: '120% do CDI',
    effectiveAnnualRate: 16.98,
    maturity: null,
    liquidity: 'diaria',
    ...overrides,
  };
}

function input(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    position: position(),
    rates,
    selicHistory: [13.75, 14.0, 14.25],
    institutionExposure: 1258.17,
    relevantNews: 2,
    ...overrides,
  };
}

describe('scoreFixedIncome', () => {
  it('is deterministic — the same input always produces the same score', () => {
    const first = scoreFixedIncome(input());
    const second = scoreFixedIncome(input());
    expect(first.score).toBe(second.score);
    expect(first.score).toBeGreaterThan(0);
  });

  it('scores a holding paying more than the CDI above one paying less', () => {
    const better = scoreFixedIncome(input({ position: position({ effectiveAnnualRate: 18 }) }));
    const worse = scoreFixedIncome(input({ position: position({ effectiveAnnualRate: 12 }) }));
    expect(better.score).toBeGreaterThan(worse.score);
  });

  it('puts a holding paying exactly the CDI in mid-scale territory', () => {
    const result = scoreFixedIncome(
      input({
        position: position({ effectiveAnnualRate: rates.cdi }),
        selicHistory: [14.25, 14.25],
      }),
    );
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThanOrEqual(55);
  });

  it('rewards a rising Selic over a falling one for a post-fixed holding', () => {
    const rising = scoreFixedIncome(input({ selicHistory: [13.0, 13.75, 14.25] }));
    const falling = scoreFixedIncome(input({ selicHistory: [14.25, 13.75, 13.0] }));
    expect(rising.score).toBeGreaterThan(falling.score);
  });

  it('still scores when there is not enough history for a trend', () => {
    const result = scoreFixedIncome(input({ selicHistory: [14.25] }));
    expect(result.unavailableReason).toBeNull();
    expect(result.score).toBeGreaterThan(0);
    expect(result.factors.some((factor) => factor.label.includes('Selic'))).toBe(false);
  });

  it('never returns a score outside 0 to 100', () => {
    const absurd = scoreFixedIncome(
      input({ position: position({ effectiveAnnualRate: 999 }), selicHistory: [0, 99] }),
    );
    expect(absurd.score).toBeLessThanOrEqual(100);
    expect(absurd.score).toBeGreaterThanOrEqual(0);
  });

  it('refuses to score without a CDI instead of guessing', () => {
    const result = scoreFixedIncome(input({ rates: null }));
    expect(result.unavailableReason).toContain('CDI');
    expect(result.factors).toEqual([]);
  });

  it('refuses to score a holding with no equivalent rate', () => {
    const result = scoreFixedIncome(input({ position: position({ effectiveAnnualRate: null }) }));
    expect(result.unavailableReason).not.toBeNull();
  });

  it('always explains itself with at least two factors', () => {
    // CLAUDE.md: a score is never a black box.
    expect(scoreFixedIncome(input()).factors.length).toBeGreaterThanOrEqual(2);
  });

  it('flags exposure above the FGC ceiling without moving the number', () => {
    const safe = scoreFixedIncome(input({ institutionExposure: 1000 }));
    const over = scoreFixedIncome(input({ institutionExposure: FGC_LIMIT + 1 }));

    expect(over.score).toBe(safe.score);
    expect(over.factors.some((factor) => factor.label.includes('FGC'))).toBe(true);
    expect(safe.factors.some((factor) => factor.label.includes('FGC'))).toBe(false);
  });

  it('reports news as context without letting it change the number', () => {
    const quiet = scoreFixedIncome(input({ relevantNews: 0 }));
    const noisy = scoreFixedIncome(input({ relevantNews: 40 }));
    expect(noisy.score).toBe(quiet.score);
  });

  it('names the liquidity of the holding', () => {
    const atMaturity = scoreFixedIncome(
      input({ position: position({ liquidity: 'vencimento', maturity: '2028-03-15' }) }),
    );
    expect(atMaturity.factors.some((factor) => factor.label.includes('vencimento'))).toBe(true);
  });
});
