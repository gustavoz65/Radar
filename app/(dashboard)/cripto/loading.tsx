import { TabSkeleton } from '@/components/common/tab-skeleton';

export default function Loading() {
  return <TabSkeleton statCount={4} body={{ kind: 'cards' }} />;
}
