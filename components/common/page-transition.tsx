'use client';

import { usePathname } from 'next/navigation';

/**
 * Replays the entrance animation on every navigation. Keying on the pathname
 * remounts the wrapper, which restarts the CSS animation — without it, moving
 * between tabs is a hard cut and the new screen simply appears.
 *
 * Only the entrance is animated: an exit would need the outgoing tree kept
 * alive, which is a state machine and an animation library, and the cost is not
 * worth it for a 420ms effect the reader mostly perceives as "the page settled".
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="motion-rise">
      {children}
    </div>
  );
}
