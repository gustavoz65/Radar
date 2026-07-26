export type AssetClass = 'rendaFixa' | 'cripto' | 'acoes';
export type FactorDirection = 'positive' | 'negative' | 'neutral';

export interface TimeSeriesPoint {
  date: string; // ISO 'YYYY-MM-DD'
  value: number;
}

export interface Institution {
  id: string;
  name: string;
  initials: string; // 2 chars, used by InstitutionBadge
  color: string; // hex, the badge background
}

export interface Account {
  id: string;
  institution: Institution;
  type: 'corrente' | 'poupanca' | 'investimento';
  balance: number;
  lastUpdated: string; // ISO datetime
}

export interface BasePosition {
  id: string;
  assetClass: AssetClass;
  name: string;
  institutionId: string;
  quantity: number;
  investedValue: number;
  currentValue: number;
  history: TimeSeriesPoint[];
}

export interface FixedIncomePosition extends BasePosition {
  assetClass: 'rendaFixa';
  issuer: string;
  index: 'CDI' | 'SELIC' | 'IPCA' | 'PRE';
  rateLabel: string; // '110% do CDI', 'IPCA + 6,20%'
  effectiveAnnualRate: number; // 15.57 -> % a.a., used for the CDI comparison chart
  maturity: string; // ISO 'YYYY-MM-DD'
  liquidity: 'diaria' | 'vencimento';
}

export interface CryptoPosition extends BasePosition {
  assetClass: 'cripto';
  symbol: string; // 'BTC'
  priceBrl: number;
  change24h: number; // percentage number
}

export interface EquityPosition extends BasePosition {
  assetClass: 'acoes';
  ticker: string; // 'PETR4'
  kind: 'acao' | 'fii';
  price: number;
  changeDay: number; // percentage number
  dividendYield: number; // percentage number, a.a.
}

export type Position = FixedIncomePosition | CryptoPosition | EquityPosition;

export interface SignalFactor {
  label: string;
  direction: FactorDirection;
  weight: number; // 0-100, relative contribution shown as a bar
}

export interface Signal {
  id: string;
  title: string;
  assetClass: AssetClass;
  score: number; // 0-100
  factors: SignalFactor[];
  summary: string;
  disclaimer: string;
  updatedAt: string; // ISO datetime
}

export type NewsCategory = 'selic' | 'cripto' | 'acoes' | 'bancos';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string; // ISO datetime
  category: NewsCategory;
  summary: string;
}

export interface AllocationSlice {
  assetClass: AssetClass;
  label: string;
  value: number;
  percent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  dayChangeValue: number;
  dayChangePercent: number;
  allocation: AllocationSlice[];
  history: TimeSeriesPoint[]; // 12 monthly points
  averageScore: number;
}

export interface MarketRates {
  selic: number; // 14.25
  cdi: number; // 14.15
  ipca12m: number;
  poupanca: number;
  updatedAt: string;
}
