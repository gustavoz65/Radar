/** Empty states read as an invitation, never as an error. */
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <p className="text-base text-text">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
