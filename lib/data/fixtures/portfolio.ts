import type { AllocationSlice, PortfolioSummary } from '@/lib/types';
import { REFERENCE_DATE, generateSeries } from '../random';
import { cryptoPositions } from './crypto';
import { equityPositions } from './equities';
import { fixedIncomePositions } from './fixed-income';
import { signals } from './signals';

function sum(values: number[]): number {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
}

const fixedIncomeTotal = sum(fixedIncomePositions.map((p) => p.currentValue));
const cryptoTotal = sum(cryptoPositions.map((p) => p.currentValue));
const equityTotal = sum(equityPositions.map((p) => p.currentValue));
const totalValue = sum([fixedIncomeTotal, cryptoTotal, equityTotal]);

const allocation: AllocationSlice[] = [
  {
    assetClass: 'rendaFixa',
    label: 'Renda fixa',
    value: fixedIncomeTotal,
    percent: (fixedIncomeTotal / totalValue) * 100,
  },
  {
    assetClass: 'cripto',
    label: 'Cripto',
    value: cryptoTotal,
    percent: (cryptoTotal / totalValue) * 100,
  },
  {
    assetClass: 'acoes',
    label: 'Ações e FIIs',
    value: equityTotal,
    percent: (equityTotal / totalValue) * 100,
  },
];

const averageScore = Math.round(sum(signals.map((s) => s.score)) / signals.length);

export const portfolioSummary: PortfolioSummary = {
  totalValue,
  dayChangeValue: 1842.67,
  dayChangePercent: 0.51,
  allocation,
  history: generateSeries({
    seed: 1,
    points: 12,
    endValue: totalValue,
    volatility: 0.018,
    drift: 0.223,
    step: 'month',
    endDate: REFERENCE_DATE,
  }),
  averageScore,
};
