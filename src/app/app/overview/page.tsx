import { redirect } from 'next/navigation';

/** Overview removed; redirect to dashboard. */
export default function OverviewPage() {
  redirect('/app/dashboard');
}
