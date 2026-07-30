import type { Institution } from '@/lib/types';

/**
 * Single source for institution identity, keyed by Pierre's providerCode. These
 * hexes were duplicated in two files once and drifted apart. No official logos:
 * the initials badge is the whole visual identity.
 */
export const institutionsByProviderCode = {
  BANCO_DO_BRASIL: { id: 'bb', name: 'Banco do Brasil', initials: 'BB', color: '#f5c518' },
  NUBANK: { id: 'nubank', name: 'Nubank', initials: 'NU', color: '#820ad1' },
  SICREDI: { id: 'sicredi', name: 'Sicredi', initials: 'SI', color: '#3fa110' },
  MERCADO_PAGO: { id: 'mercadopago', name: 'Mercado Pago', initials: 'MP', color: '#00a1e0' },
} satisfies Record<string, Institution>;

/** The same institutions as a list, in the order the overview shows them. */
export const institutions: Institution[] = Object.values(institutionsByProviderCode);

export function institutionById(id: string): Institution {
  const found = institutions.find((institution) => institution.id === id);
  if (!found) throw new Error(`Unknown institution: ${id}`);
  return found;
}
