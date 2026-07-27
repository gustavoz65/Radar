import type { Institution } from '@/lib/types';
import { institutionsByProviderCode } from '@/lib/shared/institutions';

/**
 * Pierre identifies banks by providerCode. The four connected institutions live
 * in the shared catalogue (`lib/shared/institutions.ts`) so the fixtures and this
 * mapper can never drift apart on a colour or a name.
 */
const known: Record<string, Institution> = institutionsByProviderCode;

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

/**
 * Pierre identifies the institution by display name (`connectorName`), e.g.
 * "Banco do Brasil". Folding whitespace to underscores turns that into the
 * stable code the catalogue is keyed by, so the badge survives Pierre changing
 * capitalisation or spacing.
 */
export function normalizeProviderCode(connectorName: string): string {
  return connectorName.trim().toUpperCase().replace(/\s+/g, '_');
}

/** Never throws: an unknown provider still gets a usable badge. */
export function institutionForProviderCode(code: string): Institution {
  const normalized = normalizeProviderCode(code);
  const match = known[normalized];
  if (match) return match;

  return {
    id: normalized.toLowerCase(),
    name: titleCase(normalized),
    initials: initialsFor(normalized),
    color: FALLBACK_COLOR,
  };
}
