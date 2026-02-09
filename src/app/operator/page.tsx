import { redirect } from 'next/navigation';
import { getUserContext, hasModule } from '@/lib/user-context';
import Link from 'next/link';

export default async function OperatorDashboard() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) redirect('/onboarding');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Operator workspace</h1>
      <p className="text-muted-foreground">Sales, ops, and modules by plan.</p>
      <nav className="flex flex-wrap gap-2">
        {hasModule(context, 'sales') && (
          <Link href="/operator/sales" className="text-primary underline">Sales</Link>
        )}
        {hasModule(context, 'ops') && (
          <Link href="/operator/ops" className="text-primary underline">Operations</Link>
        )}
        {hasModule(context, 'finance') && (
          <Link href="/operator/finance" className="text-primary underline">Finance</Link>
        )}
        {hasModule(context, 'compliance') && (
          <Link href="/operator/compliance" className="text-primary underline">Compliance</Link>
        )}
        {hasModule(context, 'supplies') && (
          <Link href="/operator/supplies" className="text-primary underline">Supplies</Link>
        )}
      </nav>
    </div>
  );
}
