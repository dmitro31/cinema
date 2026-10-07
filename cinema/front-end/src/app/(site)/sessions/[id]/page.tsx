import { SessionView } from '@/features/session/components/SessionView';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SessionView id={id} />;
}