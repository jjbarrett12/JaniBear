import { redirect } from 'next/navigation';

/** Alias: Contract Launch detail → Launch Packet detail. */
export default async function ContractLaunchDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(`/app/sales/launch-packets/${id}`);
}

