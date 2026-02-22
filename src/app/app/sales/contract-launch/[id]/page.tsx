import { redirect } from 'next/navigation';

/** Alias: Contract Launch detail → Launch Packet detail. */
export default function ContractLaunchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/sales/launch-packets/${id}`);
}
