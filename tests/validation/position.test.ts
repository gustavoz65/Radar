import { describe, expect, it } from 'vitest';
import { parsePositionInput } from '@/lib/validation/position';

const valid = {
  assetClass: 'rendaFixa',
  name: 'CDB Banco do Brasil 2028',
  quantity: 1,
  unitValue: 34120.45,
  investedValue: 30000,
  contractedRate: '110% do CDI',
  maturityDate: '2028-03-15',
  purchasedAt: '2025-03-15',
};

describe('parsePositionInput', () => {
  it('accepts a valid fixed income position', () => {
    const parsed = parsePositionInput(valid);
    expect(parsed.assetClass).toBe('rendaFixa');
    expect(parsed.unitValue).toBe(34120.45);
    expect(parsed.purchasedAt.toISOString()).toBe('2025-03-15T00:00:00.000Z');
  });

  it('rejects an unknown asset class', () => {
    expect(() => parsePositionInput({ ...valid, assetClass: 'imoveis' })).toThrow();
  });

  it('rejects an empty name', () => {
    expect(() => parsePositionInput({ ...valid, name: '   ' })).toThrow();
  });

  it('rejects a negative quantity', () => {
    expect(() => parsePositionInput({ ...valid, quantity: -1 })).toThrow();
  });

  it('rejects a zero quantity', () => {
    expect(() => parsePositionInput({ ...valid, quantity: 0 })).toThrow();
  });

  it('rejects a negative unit value', () => {
    expect(() => parsePositionInput({ ...valid, unitValue: -0.01 })).toThrow();
  });

  it('rejects a negative invested value', () => {
    expect(() => parsePositionInput({ ...valid, investedValue: -1 })).toThrow();
  });

  it('accepts a zero invested value', () => {
    expect(() => parsePositionInput({ ...valid, investedValue: 0 })).not.toThrow();
  });

  it('treats an omitted maturity date as null', () => {
    const payload = { ...valid };
    delete (payload as Record<string, unknown>).maturityDate;
    expect(parsePositionInput(payload).maturityDate).toBeNull();
  });

  it('parses dates as UTC midnight so the stored day never shifts', () => {
    const parsed = parsePositionInput({ ...valid, purchasedAt: '2026-12-31' });
    expect(parsed.purchasedAt.toISOString()).toBe('2026-12-31T00:00:00.000Z');
  });

  it('rejects a malformed date', () => {
    expect(() => parsePositionInput({ ...valid, purchasedAt: 'ontem' })).toThrow();
  });

  it('trims the name', () => {
    expect(parsePositionInput({ ...valid, name: '  CDB  ' }).name).toBe('CDB');
  });
});
