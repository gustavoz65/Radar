import { notFound } from 'next/navigation';
import { SignalDetail } from '@/components/signal/signal-detail';
import { getSignalById } from '@/lib/data/services';

export default async function SignalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = await getSignalById(id);

  if (!signal) notFound();

  return <SignalDetail signal={signal} />;
}
