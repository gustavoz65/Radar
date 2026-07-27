import { TabSkeleton } from '@/components/common/tab-skeleton';

export default function Loading() {
  return <TabSkeleton statCount={0} body={{ kind: 'table' }} />;
}
