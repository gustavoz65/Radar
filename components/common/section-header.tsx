export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold text-text sm:text-2xl">{title}</h1>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
  );
}
