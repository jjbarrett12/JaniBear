import { redirect } from 'next/navigation';

/** Pipeline Analytics is now under Reports → Pipeline Analytics tab. */
export default function SalesPipelinePage() {
  redirect('/app/kpis?tab=pipeline');
}
