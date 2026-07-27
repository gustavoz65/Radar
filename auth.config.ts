import type { NextAuthConfig } from 'next-auth';

// Edge-safe half of the NextAuth config: no providers, no bcrypt, nothing that
// touches Node-only APIs. `middleware.ts` builds its own NextAuth instance from
// this file alone so the Edge middleware bundle never pulls in bcryptjs (which
// does a top-level `import ... from "crypto"`, unsupported on the Edge runtime).
// `auth.ts` spreads this same config and adds the Credentials provider on top,
// for use only in the Node.js-runtime route handler. Do not merge the two back
// into one file — that's what caused the Edge-runtime bcrypt bundling warning.
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    // Invoked by middleware: without this, `auth as middleware` never redirects
    // unauthenticated requests — it only attaches the session, it doesn't gate.
    authorized: ({ auth }) => !!auth,
  },
  providers: [],
} satisfies NextAuthConfig;
