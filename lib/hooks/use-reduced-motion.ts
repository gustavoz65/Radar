'use client';

import { useEffect, useState } from 'react';

/**
 * Recharts animates through JavaScript, so the CSS `prefers-reduced-motion`
 * block in `app/globals.css` cannot reach it — every chart has to ask.
 *
 * Starts `false` so the server and the first client render agree; a reader who
 * asked for reduced motion sees the value flip in the same tick, before the
 * chart's animation would have made any visible progress.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
