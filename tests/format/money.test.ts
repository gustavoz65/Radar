import { describe, expect, it } from 'vitest';
import { formatBRL, formatCompactBRL } from '@/lib/format/money';

describe('formatBRL', () => {
  it('formats a value with two decimals and pt-BR separators', () => {
    expect(formatBRL(1234.5)).toBe('R$ 1.234,50');
  });

  it('uses a regular space after the currency symbol', () => {
    expect(formatBRL(10)).not.toMatch(/[\u00a0\u202f]/);
    expect(formatBRL(10)).toBe('R$ 10,00');
  });

  it('formats negative values', () => {
    expect(formatBRL(-42.1)).toBe('-R$ 42,10');
  });

  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });
});

describe('formatCompactBRL', () => {
  it('abbreviates millions', () => {
    expect(formatCompactBRL(1234567)).toBe('R$ 1,23 mi');
  });

  it('abbreviates thousands', () => {
    expect(formatCompactBRL(45230)).toBe('R$ 45,23 mil');
  });

  it('falls back to the full format below one thousand', () => {
    expect(formatCompactBRL(870.4)).toBe('R$ 870,40');
  });
});
