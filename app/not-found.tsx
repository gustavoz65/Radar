import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-sm tracking-widest text-muted">404</p>
      <h1 className="text-xl text-text">Essa tela não existe no radar</h1>
      <Link href="/visao-geral" className="text-sm text-accent hover:underline">
        Voltar para a visão geral
      </Link>
    </div>
  );
}
