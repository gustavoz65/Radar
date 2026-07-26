const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Intl inserts a narrow/non-breaking space after "R$"; normalise it so output is predictable. */
function normalizeSpaces(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

export function formatBRL(value: number): string {
  return normalizeSpaces(brl.format(value));
}

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCompactBRL(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    return `${sign}R$ ${decimal.format(abs / 1_000_000)} mi`;
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${decimal.format(abs / 1_000)} mil`;
  }
  return formatBRL(value);
}
