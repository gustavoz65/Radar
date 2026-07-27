import type { Institution } from '@/lib/types';

/**
 * Pierre identifies banks by providerCode. These four are the user's connected
 * institutions; the colours match the badges the frontend already used.
 * No official logos — an initials badge is the whole visual identity.
 */
const known: Record<string, Institution> = {
  BANCO_DO_BRASIL: { id: 'bb', name: 'Banco do Brasil', initials: 'BB', color: '#f5c518' },
  NUBANK: { id: 'nubank', name: 'Nubank', initials: 'NU', color: '#820ad1' },
  SICREDI: { id: 'sicredi', name: 'Sicredi', initials: 'SI', color: '#3fa110' },
  MERCADO_PAGO: { id: 'mercadopago', name: 'Mercado Pago', initials: 'MP', color: '#00a1e0' },
};

const FALLBACK_COLOR = '#4b5563';

function titleCase(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function initialsFor(code: string): string {
  const words = code.split('_').filter(Boolean);
  const letters =
    words.length >= 2 ? `${words[0][0]}${words[1][0]}` : (words[0] ?? 'XX').slice(0, 2);
  return letters.toUpperCase().padEnd(2, 'X').slice(0, 2);
}

/** Never throws: an unknown provider still gets a usable badge. */
export function institutionForProviderCode(code: string): Institution {
  const normalized = code.trim().toUpperCase();
  const match = known[normalized];
  if (match) return match;

  return {
    id: normalized.toLowerCase(),
    name: titleCase(normalized),
    initials: initialsFor(normalized),
    color: FALLBACK_COLOR,
  };
}
