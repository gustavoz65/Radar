import { wellClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';

export function SignalDisclaimer({ text }: { text: string }) {
  return <p className={cn(wellClass, 'px-3 py-2.5 text-xs leading-relaxed text-muted')}>{text}</p>;
}
