import { redirect } from 'next/navigation';

/** Backward compatibility: /sales/launch-packet (singular) → /sales/launch-packets (canonical). */
export default function LaunchPacketRedirect() {
  redirect('/app/sales/launch-packets');
}
