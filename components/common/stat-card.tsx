import { DataLabel } from '@/components/common/typography';
import { surfaceCardClass } from '@/components/common/surface';

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
    <div className={surfaceCardClass}>
      <DataLabel>{label}</DataLabel>
      <p className="tabular mt-2 font-mono text-xl text-text sm:text-2xl">{value}</p>
      {hint ? <div className="mt-1.5 text-sm">{hint}</div> : null}
    </div>
  );
}
