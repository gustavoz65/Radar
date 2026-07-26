export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="tabular mt-2 font-mono text-xl text-text sm:text-2xl">{value}</p>
      {hint ? <div className="mt-1.5 text-sm">{hint}</div> : null}
    </div>
  );
}
