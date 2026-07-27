import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { createPosition } from '@/lib/repositories/positions';
import { parsePositionInput } from '@/lib/validation/position';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  try {
    const id = await createPosition(parsePositionInput(await request.json()));
    revalidatePath('/posicoes');
    revalidatePath('/visao-geral');
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: z.treeifyError(error) }, { status: 400 });
    }
    throw error;
  }
}
