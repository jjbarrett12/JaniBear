import { redirect } from 'next/navigation';

/** Performance Command Center is now under Reports → Performance tab. */
export default function KpiCommandCenterPage() {
  redirect('/app/kpis?tab=performance');
}
