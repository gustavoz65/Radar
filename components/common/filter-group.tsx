'use client';

import { cn } from '@/lib/utils';

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterGroupProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  buttonClassName?: string;
}

export function FilterGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  buttonClassName,
}: FilterGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className={className}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative rounded-md border px-3 py-1.5 text-sm transition-colors duration-(--dur-1)',
            value === option.value
              ? 'border-border bg-surface-raised text-text'
              : 'border-transparent text-muted hover:bg-surface hover:text-text',
            buttonClassName,
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
