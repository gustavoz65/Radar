import type { Institution } from '@/lib/types';

/**
 * Single source of truth for the connected institutions' identity (name,
 * initials, brand colour). Both the mocked fixtures and the Pierre mapper read
 * from here — the same hex values used to be duplicated across
 * `lib/data/fixtures/institutions.ts` and `lib/pierre/institutions.ts`, where a
 * colour tweak in one silently diverged from the other.
 *
 * Keyed by Pierre's providerCode. No official logos: an initials badge is the
 * whole visual identity.
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
