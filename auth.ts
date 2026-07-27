import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/auth/password';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    // Invoked by middleware: without this, `auth as middleware` never redirects
    // unauthenticated requests — it only attaches the session, it doesn't gate.
    authorized: ({ auth: session }) => !!session,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === 'string' ? credentials.email : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        const allowedEmail = process.env.AUTH_USER_EMAIL;
        const passwordHash = process.env.AUTH_USER_PASSWORD_HASH;
        if (!allowedEmail || !passwordHash) return null;

        // Single-user app: the email must match exactly and the password must verify.
        if (email.toLowerCase() !== allowedEmail.toLowerCase()) return null;
        if (!(await verifyPassword(password, passwordHash))) return null;

        return { id: 'radar-user', email: allowedEmail, name: 'Radar' };
      },
    }),
  ],
});
