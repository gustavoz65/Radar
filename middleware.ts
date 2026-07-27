export { auth as middleware } from '@/auth';

export const config = {
  // Everything except Next internals, static assets and the auth endpoints.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
};
