import type { Account } from '@/lib/types';
import { institutionById } from './institutions';

export const accounts: Account[] = [
  {
    id: 'acc-bb-cc',
    institution: institutionById('bb'),
    type: 'corrente',
    balance: 4820.33,
    lastUpdated: '2026-07-26T09:12:00.000Z',
  },
  {
    id: 'acc-bb-inv',
    institution: institutionById('bb'),
    type: 'investimento',
    balance: 61240.0,
    lastUpdated: '2026-07-26T09:12:00.000Z',
  },
  {
    id: 'acc-nubank-cc',
    institution: institutionById('nubank'),
    type: 'corrente',
    balance: 2310.87,
    lastUpdated: '2026-07-26T08:47:00.000Z',
  },
  {
    id: 'acc-nubank-inv',
    institution: institutionById('nubank'),
    type: 'investimento',
    balance: 38790.5,
    lastUpdated: '2026-07-26T08:47:00.000Z',
  },
  {
    id: 'acc-sicredi-poup',
    institution: institutionById('sicredi'),
    type: 'poupanca',
    balance: 12500.0,
    lastUpdated: '2026-07-25T22:05:00.000Z',
  },
  {
    id: 'acc-mp-cc',
    institution: institutionById('mercadopago'),
    type: 'corrente',
    balance: 1985.24,
    lastUpdated: '2026-07-26T07:30:00.000Z',
  },
];
