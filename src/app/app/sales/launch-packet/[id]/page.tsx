import { redirect } from 'next/navigation';

/** Backward compatibility: /sales/launch-packet/[id] → /sales/launch-packets/[id] (canonical). */
export default async function LaunchPacketDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/sales/launch-packets/${id}`);
}
