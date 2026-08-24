import type { Institution } from '@/lib/types';

/**
 * Initials badge — the product never ships official bank logos. The inner ring
 * keeps a badge in a light brand colour from bleeding into a dark surface, and
 * the colour comes from the institution record, not from a design token.
 */
export function InstitutionBadge({
  institution,
  showName = false,
}: {
  institution: Institution;
  showName?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-[0.6875rem] font-semibold tracking-tight text-white ring-1 ring-white/10 ring-inset"
        style={{ backgroundColor: institution.color }}
      >
        {institution.initials}
      </span>
      <span className={showName ? 'text-sm text-text' : 'sr-only'}>{institution.name}</span>
    </span>
  );
}
