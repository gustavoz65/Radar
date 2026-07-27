import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/auth/password';
import { authConfig } from '@/auth.config';

// Node-only half: spreads the shared Edge-safe config and adds the Credentials
// provider, which needs bcrypt (via `verifyPassword`). Only imported by the
// route handler (`app/api/auth/[...nextauth]/route.ts`), which runs on the
// Node.js runtime — never by `middleware.ts`. See `auth.config.ts`.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        // Run both checks unconditionally, regardless of whether the email matches,
        // so a wrong-email attempt takes the same time as a wrong-password attempt.
        // Short-circuiting on the email check would leak, via response timing,
        // whether AUTH_USER_EMAIL matches the attempted address (a timing oracle).
        const emailMatches = email.toLowerCase() === allowedEmail.toLowerCase();
        const passwordMatches = await verifyPassword(password, passwordHash);
        if (!emailMatches || !passwordMatches) return null;

        return { id: 'radar-user', email: allowedEmail, name: 'Radar' };
      },
    }),
  ],
});
