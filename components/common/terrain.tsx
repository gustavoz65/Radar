/**
 * The ambient field the whole app sits on: a measured grid, a dot-matrix
 * contour dissolving at its edges, and a slow radar sweep. It is decoration —
 * `aria-hidden`, pointer-transparent, and behind every layer — but it is what
 * makes a screen of numbers read as an instrument rather than a form.
 *
 * Built from gradients only: no image to download, no brand asset, and one
 * token edit in `app/globals.css` retunes all three layers at once.
 */
export function TerrainField() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Depth wash — the page is brighter where the sweep originates. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_85%_-10%,var(--surface),transparent_70%)]" />
      <div className="terrain-grid absolute inset-0 opacity-70" />
      <div className="terrain-dots absolute inset-0 opacity-90" />
      {/* Anchored off-screen to the top-right so only the sweep's tail crosses
          the content area; a full-page sweep would strobe behind the tables. */}
      <div className="absolute -top-[70vmax] -right-[45vmax] size-[140vmax] opacity-[0.045]">
        <div className="terrain-sweep size-full rounded-full" />
      </div>
      {/* Grounds the field: content at the bottom of a long page sits on flat
          background rather than trailing off mid-grid. */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(to_top,var(--bg),transparent)]" />
    </div>
  );
}
