import { describe, expect, it, vi } from 'vitest';
import { DISCLAIMER, runScoring, type ScoringDeps } from '@/lib/scoring/run-scoring';
import { FORMULA_VERSION, scoreFixedIncome } from '@/lib/scoring/fixed-income';
import type { FixedIncomePosition, MarketRates } from '@/lib/types';

const rates: MarketRates = {
  selic: 14.25,
  cdi: 14.15,
  ipca12m: 4.64,
  poupanca: 8.4,
  updatedAt: '2026-07-28T00:00:00.000Z',
};

const position: FixedIncomePosition = {
  id: '7',
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
};

const selicHistory = [13.75, 14.0, 14.25];

function deps<T extends Partial<ScoringDeps>>(overrides = {} as T) {
  return {
    fixedIncomePositions: vi.fn().mockResolvedValue([position]),
    rates: vi.fn().mockResolvedValue(rates),
    selicHistory: vi.fn().mockResolvedValue(selicHistory),
    news: vi.fn().mockResolvedValue([
      {
        id: '1',
        title: 'Copom mantém a Selic',
        source: 'InfoMoney',
        publishedAt: '2026-07-27T00:00:00.000Z',
        category: 'selic' as const,
        summary: '',
      },
    ]),
    explain: vi
      .fn()
      .mockResolvedValue([
        { id: '7', title: 'Rende acima do CDI', summary: 'Cenário favorável a pós-fixados.' },
      ]),
    saveSignals: vi.fn().mockResolvedValue(1),
    pruneSignals: vi.fn().mockResolvedValue(undefined),
    now: () => new Date('2026-07-28T12:00:00.000Z'),
    ...overrides,
  };
}

/** The score the formula produces for this position, independent of the engine. */
const expectedScore = scoreFixedIncome({
  position,
  rates,
  selicHistory,
  institutionExposure: position.currentValue,
  relevantNews: 1,
}).score;

describe('runScoring', () => {
  it('stores the score the formula produced', async () => {
    const d = deps();
    await runScoring(d);

    const [[saved]] = d.saveSignals.mock.calls;
    expect(saved[0].score).toBe(expectedScore);
    expect(saved[0].formulaVersion).toBe(FORMULA_VERSION);
  });

  it('ignores any score the model tries to return', async () => {
    // The contract: the model writes prose, never the number.
    const d = deps({
      explain: vi
        .fn()
        .mockResolvedValue([{ id: '7', title: 'Nota 99', summary: 'Score 99/100.', score: 99 }]),
    });

    await runScoring(d);

    const [[saved]] = d.saveSignals.mock.calls;
    expect(saved[0].score).toBe(expectedScore);
    expect(saved[0].score).not.toBe(99);
  });

  it('never sends the score to the model', async () => {
    const d = deps();
    await runScoring(d);

    const [[requests]] = d.explain.mock.calls;
    const serialised = JSON.stringify(requests);
    expect(serialised).not.toContain('score');
    expect(serialised).not.toContain(String(expectedScore));
  });

  it('keeps the score and the breakdown when the model fails', async () => {
    const d = deps({ explain: vi.fn().mockResolvedValue([]) });
    const result = await runScoring(d);

    const [[saved]] = d.saveSignals.mock.calls;
    expect(saved[0].score).toBe(expectedScore);
    expect(saved[0].factors.length).toBeGreaterThanOrEqual(2);
    expect(saved[0].summary).toContain('indisponível');
    expect(result.explained).toBe(false);
  });

  it('attaches the fixed disclaimer to every signal', async () => {
    const d = deps();
    await runScoring(d);

    const [[saved]] = d.saveSignals.mock.calls;
    expect(saved[0].disclaimer).toBe(DISCLAIMER);
    expect(saved[0].disclaimer).toContain('Não é recomendação');
  });

  it('always saves a visible breakdown, never a bare number', async () => {
    const d = deps();
    await runScoring(d);

    const [[saved]] = d.saveSignals.mock.calls;
    expect(saved[0].factors.length).toBeGreaterThanOrEqual(2);
  });

  it('skips a position it cannot score instead of inventing one', async () => {
    const d = deps({ rates: vi.fn().mockResolvedValue(null) });
    const result = await runScoring(d);

    expect(result.scored).toBe(0);
    expect(result.skipped).toHaveLength(1);
    const [[saved]] = d.saveSignals.mock.calls;
    expect(saved).toEqual([]);
  });

  it('prunes signals whose position no longer exists', async () => {
    const d = deps();
    await runScoring(d);
    expect(d.pruneSignals).toHaveBeenCalledWith([7]);
  });

  it('only feeds the model news about juros and bancos', async () => {
    const d = deps({
      news: vi.fn().mockResolvedValue([
        {
          id: '1',
          title: 'Bitcoin sobe',
          source: 'X',
          publishedAt: '2026-07-27T00:00:00.000Z',
          category: 'cripto' as const,
          summary: '',
        },
      ]),
    });

    await runScoring(d);

    const [[requests]] = d.explain.mock.calls;
    expect(requests[0].headlines).toEqual([]);
  });
});
