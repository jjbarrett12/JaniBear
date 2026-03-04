import { redirect } from 'next/navigation';

/** Rep Performance (Win/Loss) is now under Reports → Rep Performance tab. */
export default function WinLossPage() {
  redirect('/app/kpis?tab=rep');
}
