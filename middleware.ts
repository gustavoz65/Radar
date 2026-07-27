import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Builds its own NextAuth instance from the Edge-safe config only — deliberately
// does NOT import from `@/auth`, because that file adds the Credentials provider
// (which pulls in bcryptjs, a Node-only module) and this middleware runs on the
// Edge runtime by default. See `auth.config.ts` for the split rationale.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Everything except Next internals, static assets and the auth endpoints.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
};
