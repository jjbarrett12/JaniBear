import { redirect } from 'next/navigation';

/** Alias: Contract Launch (UI label) → Launch Packets list. */
export default function ContractLaunchPage() {
  redirect('/app/sales/launch-packets');
}
