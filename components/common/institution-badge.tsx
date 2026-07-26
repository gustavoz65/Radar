import type { Institution } from '@/lib/types';

/** Initials badge — the product never ships official bank logos. */
export function InstitutionBadge({
  institution,
  showName = false,
}: {
  institution: Institution;
  showName?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold text-white"
        style={{ backgroundColor: institution.color }}
      >
        {institution.initials}
      </span>
      <span className={showName ? 'text-sm text-text' : 'sr-only'}>{institution.name}</span>
    </span>
  );
}
