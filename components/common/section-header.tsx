import { DisplayTitle, Eyebrow } from '@/components/common/typography';

/**
 * The header every route opens with. The eyebrow says what kind of screen this
 * is, the display title says which one, and the rule under it closes the block
 * so the content below starts on a clean field.
 *
 * `actions` lives here rather than being laid out by each page, which is how
 * the overview ended up with a bespoke flex row nothing else shared.
 */
export function SectionHeader({
  eyebrow,
  title,
  highlight,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  /** Word inside `title` promoted out of the dim display gray. */
  highlight?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <DisplayTitle highlight={highlight}>{title}</DisplayTitle>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {/* Measured rule: solid where the title starts, dissolving to the right —
          the same "reading fades out at the edge" idea as the terrain field. */}
      <div
        aria-hidden
        className="h-px bg-[linear-gradient(to_right,var(--border-strong),var(--border)_35%,transparent)]"
      />
    </header>
  );
}
