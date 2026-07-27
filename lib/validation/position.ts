import { z } from 'zod';
import type { PositionInput } from '@/lib/repositories/positions';

/**
 * Accepts 'YYYY-MM-DD' and anchors it at UTC midnight, so the day a user picks
 * is the day that gets stored no matter what timezone the server sits in.
 */
const utcDate = z
  .string()
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
    message: 'Data inválida',
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const positionSchema = z.object({
  assetClass: z.enum(['rendaFixa', 'cripto', 'acoes']),
  name: z.string().trim().min(1, 'Informe um nome'),
  ticker: z.string().trim().min(1).nullish(),
  institutionCode: z.string().trim().min(1).nullish(),
  quantity: z.number().positive('A quantidade precisa ser maior que zero'),
  unitValue: z.number().nonnegative('O valor unitário não pode ser negativo'),
  investedValue: z.number().nonnegative('O valor investido não pode ser negativo'),
  contractedRate: z.string().trim().min(1).nullish(),
  maturityDate: utcDate.nullish(),
  purchasedAt: utcDate,
  notes: z.string().trim().min(1).nullish(),
});

export function parsePositionInput(payload: unknown): PositionInput {
  const parsed = positionSchema.parse(payload);
  return {
    ...parsed,
    ticker: parsed.ticker ?? null,
    institutionCode: parsed.institutionCode ?? null,
    contractedRate: parsed.contractedRate ?? null,
    maturityDate: parsed.maturityDate ?? null,
    notes: parsed.notes ?? null,
  };
}
