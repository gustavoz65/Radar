import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { auth, signIn } from '@/auth';
import { TerrainField } from '@/components/common/terrain';
import { RadarMark } from '@/components/shell/radar-mark';
import { DisplayTitle, Eyebrow, dataLabelClass } from '@/components/common/typography';
import { instrumentCardClass, wellClass } from '@/components/common/surface';
import { primaryActionClass } from '@/components/common/action';
import { cn } from '@/lib/utils';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const session = await auth();
  if (session) redirect('/visao-geral');

  // The failed-login redirect lands on /login?erro=1; without reading it,
  // a wrong password looks like nothing happened at all.
  const { erro } = await searchParams;

  const fieldClass = cn(
    wellClass,
    'w-full px-3 py-2 text-sm text-text transition-colors duration-(--dur-1) focus:border-border-strong',
  );

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-12">
      <TerrainField />

      <div className="motion-rise w-full max-w-sm space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <RadarMark className="size-5 shrink-0" />
            <span className="font-mono text-sm tracking-[0.28em] text-text">RADAR</span>
          </div>
          <Eyebrow>Acesso restrito</Eyebrow>
          <DisplayTitle highlight="Entrar" className="text-[clamp(1.75rem,1.2rem+2vw,2.5rem)]">
            Entrar
          </DisplayTitle>
          <p className="text-sm leading-relaxed text-muted">
            Esta instância tem um único dono. Não há cadastro público.
          </p>
        </div>

        <div className={instrumentCardClass}>
          {erro ? (
            <p role="alert" className="mb-4 text-sm text-negative">
              E-mail ou senha incorretos.
            </p>
          ) : null}

          <form
            className="space-y-4"
            action={async (formData: FormData) => {
              'use server';
              try {
                await signIn('credentials', {
                  email: formData.get('email'),
                  password: formData.get('password'),
                  redirectTo: '/visao-geral',
                });
              } catch (error) {
                if (error instanceof AuthError) redirect('/login?erro=1');
                throw error;
              }
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className={cn(dataLabelClass, 'block')}>
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className={cn(dataLabelClass, 'block')}>
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={fieldClass}
              />
            </div>
            <button type="submit" className={cn(primaryActionClass, 'w-full')}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
