import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { deletePosition, updatePosition } from '@/lib/repositories/positions';
import { parsePositionInput } from '@/lib/validation/position';

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: 'Id inválido.' }, { status: 400 });

  try {
    await updatePosition(id, parsePositionInput(await request.json()));
    revalidatePath('/posicoes');
    revalidatePath('/visao-geral');
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: z.treeifyError(error) }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: 'Id inválido.' }, { status: 400 });

  await deletePosition(id);
  revalidatePath('/posicoes');
  revalidatePath('/visao-geral');
  return NextResponse.json({ ok: true });
}
