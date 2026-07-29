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

/** `credito` is a credit card: a connected account whose balance is a bill, not an asset. */
export type AccountType = 'corrente' | 'poupanca' | 'investimento' | 'credito';

export interface Account {
  id: string;
  institution: Institution;
  type: AccountType;
  /** For a `credito` account this is the current bill, not money held. */
  balance: number;
  lastUpdated: string; // ISO datetime
  /** Credit cards only — what Pierre's dashboard calls "disponível". */
  creditLimit: number | null;
  availableCreditLimit: number | null;
  balanceDueDate: string | null; // ISO 'YYYY-MM-DD'
}

/** `pierre` positions are rewritten by every sync, so the UI must not offer to edit them. */
export type PositionSource = 'manual' | 'pierre';

export interface BasePosition {
  id: string;
  assetClass: AssetClass;
  name: string;
  institutionId: string;
  quantity: number;
  investedValue: number;
  currentValue: number;
  history: TimeSeriesPoint[];
  source: PositionSource;
}

export interface FixedIncomePosition extends BasePosition {
  assetClass: 'rendaFixa';
  issuer: string;
  index: 'CDI' | 'SELIC' | 'IPCA' | 'PRE';
  rateLabel: string; // '110% do CDI', 'IPCA + 6,20%'
  /**
   * % a.a., used for the CDI comparison chart. Null when Radar cannot compute it
   * — a synced caixinha reports "120% do CDI" but nothing prices that until
   * sub-project 3 supplies a real CDI. Charting a 0 there would claim the
   * holding yields nothing.
   */
  effectiveAnnualRate: number | null;
  /** ISO 'YYYY-MM-DD', or null for an open-ended holding with daily liquidity. */
  maturity: string | null;
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

/** `mercado` is the honest bucket for articles no keyword claims — never a silent 'acoes'. */
export type NewsCategory = 'selic' | 'cripto' | 'acoes' | 'bancos' | 'mercado';

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

/**
 * What the last sync attempt achieved. A failed attempt never blanks the screen:
 * `lastSuccessfulAt` is what the numbers on screen actually came from, and
 * `error` is the warning shown next to them.
 */
export interface SyncStatus {
  status: 'success' | 'partial' | 'error' | null;
  finishedAt: string | null; // ISO datetime
  error: string | null;
  lastSuccessfulAt: string | null; // ISO datetime
}

export interface MarketRates {
  selic: number; // 14.25
  cdi: number; // 14.15
  ipca12m: number;
  poupanca: number;
  updatedAt: string;
}
