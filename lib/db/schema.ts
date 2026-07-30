import {
  boolean,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

/** Bank accounts mirrored from Pierre. Never written to by the user. */
export const bankAccounts = mysqlTable(
  'bank_account',
  {
    id: int('id').primaryKey().autoincrement(),
    /** Pierre's accountId — the sync upsert key. */
    externalId: varchar('external_id', { length: 128 }).notNull(),
    /** Pierre's providerCode, e.g. "NUBANK". */
    providerCode: varchar('provider_code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: mysqlEnum('type', ['corrente', 'poupanca', 'investimento', 'credito']).notNull(),
    /** For a `credito` account this is the current bill, not money held. */
    balance: decimal('balance', { precision: 15, scale: 2 }).notNull(),
    currencyCode: varchar('currency_code', { length: 8 }).notNull().default('BRL'),
    /** Credit cards only — what Pierre's own dashboard shows as "disponível". */
    creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
    availableCreditLimit: decimal('available_credit_limit', { precision: 15, scale: 2 }),
    balanceDueDate: datetime('balance_due_date'),
    minimumPayment: decimal('minimum_payment', { precision: 15, scale: 2 }),
    closingDay: int('closing_day'),
    /** Pierre reports false for every card: transactions may not have posted yet. */
    billIsOfficial: boolean('bill_is_official'),
    lastSyncedAt: datetime('last_synced_at').notNull(),
  },
  (table) => [uniqueIndex('bank_account_external_id_idx').on(table.externalId)],
);

/** Transactions mirrored from Pierre. */
export const bankTransactions = mysqlTable(
  'bank_transaction',
  {
    id: int('id').primaryKey().autoincrement(),
    accountId: int('account_id'),
    /** Pierre's transaction id — the dedupe key. */
    externalId: varchar('external_id', { length: 128 }).notNull(),
    description: varchar('description', { length: 512 }).notNull(),
    category: varchar('category', { length: 128 }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    occurredAt: datetime('occurred_at').notNull(),
  },
  (table) => [
    uniqueIndex('bank_transaction_external_id_idx').on(table.externalId),
    index('bank_transaction_occurred_at_idx').on(table.occurredAt),
  ],
);

/**
 * Investment holdings. Mostly entered by hand — Pierre exposes no positions
 * endpoint — except for "caixinhas" (reserved balances inside a checking
 * account), which the sync imports and owns.
 */
export const investmentPositions = mysqlTable(
  'investment_position',
  {
    id: int('id').primaryKey().autoincrement(),
    /** `pierre` rows are rewritten by every sync; editing them by hand is pointless. */
    source: mysqlEnum('source', ['manual', 'pierre']).notNull().default('manual'),
    /** Stable key for a synced row, so a re-sync updates instead of duplicating. */
    externalId: varchar('external_id', { length: 191 }),
    assetClass: mysqlEnum('asset_class', ['rendaFixa', 'cripto', 'acoes']).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    /** Ticker for equities, symbol for crypto, null for fixed income. */
    ticker: varchar('ticker', { length: 32 }),
    institutionCode: varchar('institution_code', { length: 64 }),
    quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
    unitValue: decimal('unit_value', { precision: 15, scale: 2 }).notNull(),
    investedValue: decimal('invested_value', { precision: 15, scale: 2 }).notNull(),
    /** Fixed income only: the contracted rate label, e.g. "110% do CDI". */
    contractedRate: varchar('contracted_rate', { length: 128 }),
    maturityDate: datetime('maturity_date'),
    purchasedAt: datetime('purchased_at').notNull(),
    notes: text('notes'),
    updatedAt: datetime('updated_at').notNull(),
  },
  // Unique so a re-sync updates the caixinha instead of adding another. MySQL
  // allows repeated NULLs here, which is what keeps manual rows unconstrained.
  (table) => [uniqueIndex('investment_position_external_id_idx').on(table.externalId)],
);

/** One row per position per sync — this is what builds the history charts. */
export const positionSnapshots = mysqlTable(
  'position_snapshot',
  {
    id: int('id').primaryKey().autoincrement(),
    positionId: int('position_id').notNull(),
    capturedAt: datetime('captured_at').notNull(),
    value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  },
  (table) => [index('position_snapshot_captured_at_idx').on(table.capturedAt)],
);

/**
 * Money already committed to card installments. One row, replaced each sync: only
 * the current commitment matters for deciding what is free to invest.
 */
export const installmentCommitment = mysqlTable('installment_commitment', {
  id: int('id').primaryKey().autoincrement(),
  amountRemaining: decimal('amount_remaining', { precision: 15, scale: 2 }).notNull(),
  installmentsRemaining: int('installments_remaining').notNull(),
  purchases: int('purchases').notNull(),
  collectedAt: datetime('collected_at').notNull(),
});

/** Economic indicators from the BCB, one row per published reference date. */
export const economicIndicators = mysqlTable(
  'economic_indicator',
  {
    id: int('id').primaryKey().autoincrement(),
    series: mysqlEnum('series', ['selic', 'cdi', 'ipca12m', 'poupanca']).notNull(),
    /** Annual percentage, e.g. 14.25. */
    value: decimal('value', { precision: 10, scale: 4 }).notNull(),
    referenceDate: datetime('reference_date').notNull(),
    collectedAt: datetime('collected_at').notNull(),
  },
  (table) => [
    uniqueIndex('economic_indicator_series_date_idx').on(table.series, table.referenceDate),
  ],
);

/**
 * Quotes, append-only: each collection adds a row, so the history charts come
 * from the same table the current price is read from.
 */
export const marketPrices = mysqlTable(
  'market_price',
  {
    id: int('id').primaryKey().autoincrement(),
    assetClass: mysqlEnum('asset_class', ['cripto', 'acoes']).notNull(),
    ticker: varchar('ticker', { length: 32 }).notNull(),
    priceBrl: decimal('price_brl', { precision: 20, scale: 8 }).notNull(),
    /** 24h change for crypto, day change for equities. Null when the source omits it. */
    changePercent: decimal('change_percent', { precision: 10, scale: 4 }),
    collectedAt: datetime('collected_at').notNull(),
  },
  (table) => [
    uniqueIndex('market_price_ticker_collected_idx').on(table.ticker, table.collectedAt),
    index('market_price_class_idx').on(table.assetClass),
  ],
);

export const newsItems = mysqlTable(
  'news_item',
  {
    id: int('id').primaryKey().autoincrement(),
    /** The article URL, which is what dedupes across feeds. */
    externalId: varchar('external_id', { length: 512 }).notNull(),
    title: varchar('title', { length: 512 }).notNull(),
    source: varchar('source', { length: 128 }).notNull(),
    url: varchar('url', { length: 512 }).notNull(),
    publishedAt: datetime('published_at').notNull(),
    category: mysqlEnum('category', ['selic', 'cripto', 'acoes', 'bancos', 'mercado']).notNull(),
    summary: text('summary'),
  },
  (table) => [
    uniqueIndex('news_item_external_id_idx').on(table.externalId),
    index('news_item_published_idx').on(table.publishedAt),
  ],
);

/**
 * Confidence signals. The score comes from the versioned formula in
 * `lib/scoring/`; the LLM only supplies title and summary.
 */
// Not named `signal`: that is a reserved word in MySQL 8, so every raw query
// against it needs backticks to parse.
export const signalRecords = mysqlTable(
  'confidence_signal',
  {
    id: int('id').primaryKey().autoincrement(),
    /** The position the signal is about, so a re-score updates instead of duplicating. */
    positionId: int('position_id').notNull(),
    assetClass: mysqlEnum('asset_class', ['rendaFixa', 'cripto', 'acoes']).notNull(),
    score: int('score').notNull(),
    /** Which formula produced the score, e.g. 'rf-1'. */
    formulaVersion: varchar('formula_version', { length: 32 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    summary: text('summary').notNull(),
    disclaimer: varchar('disclaimer', { length: 255 }).notNull(),
    updatedAt: datetime('updated_at').notNull(),
  },
  (table) => [uniqueIndex('signal_position_idx').on(table.positionId)],
);

/** The visible breakdown; a signal without factors would be a black box. */
export const signalFactors = mysqlTable(
  'confidence_signal_factor',
  {
    id: int('id').primaryKey().autoincrement(),
    signalId: int('signal_id').notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    direction: mysqlEnum('direction', ['positive', 'negative', 'neutral']).notNull(),
    weight: int('weight').notNull(),
    position: int('position').notNull(),
  },
  (table) => [index('signal_factor_signal_idx').on(table.signalId)],
);

/** Audit trail for every sync attempt, successful or not. */
export const syncLogs = mysqlTable('sync_log', {
  id: int('id').primaryKey().autoincrement(),
  source: mysqlEnum('source', ['pierre']).notNull(),
  status: mysqlEnum('status', ['success', 'partial', 'error']).notNull(),
  startedAt: datetime('started_at').notNull(),
  finishedAt: datetime('finished_at'),
  /** Human-readable, safe to show the user. Must never contain the API key. */
  error: text('error'),
});
