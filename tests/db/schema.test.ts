import { describe, expect, it } from 'vitest';
import {
  bankAccounts,
  bankTransactions,
  investmentPositions,
  positionSnapshots,
  syncLogs,
} from '@/lib/db/schema';
import { getTableName } from 'drizzle-orm';

describe('schema', () => {
  it('names every table as the spec does', () => {
    expect(getTableName(bankAccounts)).toBe('bank_account');
    expect(getTableName(bankTransactions)).toBe('bank_transaction');
    expect(getTableName(investmentPositions)).toBe('investment_position');
    expect(getTableName(positionSnapshots)).toBe('position_snapshot');
    expect(getTableName(syncLogs)).toBe('sync_log');
  });

  it('stores money as decimal, never float', () => {
    expect(bankAccounts.balance.dataType).toBe('string');
    expect(investmentPositions.unitValue.dataType).toBe('string');
    expect(positionSnapshots.value.dataType).toBe('string');
  });
});
