import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TerrainField } from '@/components/common/terrain';
import { DisplayTitle, Eyebrow } from '@/components/common/typography';
import { secondaryActionClass } from '@/components/common/action';

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <TerrainField />
      <div className="motion-rise flex flex-col items-center gap-5">
        <Eyebrow>Erro 404</Eyebrow>
        <DisplayTitle highlight="no radar">Essa tela não existe no radar</DisplayTitle>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          O endereço não corresponde a nenhuma das abas. A visão geral consolida tudo o que o Radar
          acompanha.
        </p>
        <Link href="/visao-geral" className={secondaryActionClass}>
          <ArrowLeft className="size-3.5" aria-hidden />
          Voltar para a visão geral
        </Link>
      </div>
    </main>
  );
}
