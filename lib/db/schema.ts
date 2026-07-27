import {
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
    type: mysqlEnum('type', ['corrente', 'poupanca', 'investimento']).notNull(),
    balance: decimal('balance', { precision: 15, scale: 2 }).notNull(),
    currencyCode: varchar('currency_code', { length: 8 }).notNull().default('BRL'),
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

/** Investment holdings. Entered by hand — Pierre exposes no positions endpoint. */
export const investmentPositions = mysqlTable('investment_position', {
  id: int('id').primaryKey().autoincrement(),
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
});

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
