import { ImportConfirmClient } from '@/components/onboarding-import/ImportConfirmClient';

export const dynamic = 'force-dynamic';

export default async function ImportConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string }>;
}) {
  const params = await searchParams;
  const batchId = params.batchId ?? '';

  return <ImportConfirmClient batchId={batchId} />;
}
