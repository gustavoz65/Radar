import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { auth, signIn } from '@/auth';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/visao-geral');

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <span className="size-2 rounded-full bg-gold" aria-hidden />
          <span className="font-mono text-sm tracking-widest text-text">RADAR</span>
        </div>
        <h1 className="mb-1 text-lg font-semibold text-text">Entrar</h1>
        <p className="mb-5 text-sm text-muted">Acesso restrito ao dono da conta.</p>

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
            <label htmlFor="email" className="text-xs uppercase tracking-wider text-muted">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs uppercase tracking-wider text-muted">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
