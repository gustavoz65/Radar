export function SignalDisclaimer({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-border bg-bg px-3 py-2 text-xs leading-relaxed text-muted">
      {text}
    </p>
  );
}
