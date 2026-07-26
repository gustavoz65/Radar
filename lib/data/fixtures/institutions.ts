import type { Institution } from '@/lib/types';

export const institutions: Institution[] = [
  { id: 'bb', name: 'Banco do Brasil', initials: 'BB', color: '#f5c518' },
  { id: 'nubank', name: 'Nubank', initials: 'NU', color: '#820ad1' },
  { id: 'sicredi', name: 'Sicredi', initials: 'SI', color: '#3fa110' },
  { id: 'mercadopago', name: 'Mercado Pago', initials: 'MP', color: '#00a1e0' },
];

export function institutionById(id: string): Institution {
  const found = institutions.find((institution) => institution.id === id);
  if (!found) throw new Error(`Unknown institution: ${id}`);
  return found;
}
