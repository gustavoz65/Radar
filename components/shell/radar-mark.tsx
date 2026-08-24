/**
 * The wordmark. A dish reading a field: two range rings, a crosshair, and one
 * contact blinking on the outer ring. It is drawn rather than shipped as an
 * asset so it inherits the tokens and stays crisp at any size.
 */
export function RadarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="var(--border-strong)" strokeWidth="1" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="var(--border-strong)" strokeWidth="1" />
      <path d="M12 2.5V21.5M2.5 12H21.5" stroke="var(--border)" strokeWidth="1" />
      <circle cx="12" cy="12" r="1.4" fill="var(--text-muted)" />
      {/* fill-box, or the SVG default view-box origin scales the blip off-centre. */}
      <circle
        cx="17.6"
        cy="7.3"
        r="2"
        fill="var(--signature-gold)"
        className="animate-blip [transform-box:fill-box] [transform-origin:center]"
      />
    </svg>
  );
}
