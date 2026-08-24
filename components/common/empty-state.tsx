import { DataLabel } from '@/components/common/typography';

/**
 * Empty states read as an invitation, never as an error — and they keep the
 * instrument language: a recess with the terrain showing through, so an empty
 * screen still looks like part of the app rather than a hole in it.
 */
export function EmptyState({
  title,
  description,
  label = 'Sem leitura',
}: {
  title: string;
  description: string;
  /** The mono kicker. Override when "no reading" is the wrong word for the tab. */
  label?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-dashed border-border bg-well px-6 py-14 text-center">
      <div aria-hidden className="terrain-dots absolute inset-0 opacity-40" />
      <div className="relative space-y-2">
        <DataLabel className="block">{label}</DataLabel>
        <p className="text-base text-text">{title}</p>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}
