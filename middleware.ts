import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Builds its own NextAuth instance from the Edge-safe config only — deliberately
// does NOT import from `@/auth`, because that file adds the Credentials provider
// (which pulls in bcryptjs, a Node-only module) and this middleware runs on the
// Edge runtime by default. See `auth.config.ts` for the split rationale.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Pages only. `/api` is excluded on purpose: the middleware's job is to send a
  // browser to /login, and a 307 to an HTML page is the wrong answer to a fetch —
  // the client follows it, gets 200 with the login markup, and a caller checking
  // `response.ok` concludes the write succeeded. Every route handler under /api
  // calls `auth()` itself and answers 401 in JSON, which is what a fetch can act on.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
