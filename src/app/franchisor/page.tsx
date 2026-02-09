import { redirect } from 'next/navigation';
import { getUserContext, hasModule } from '@/lib/user-context';
import Link from 'next/link';

export default async function FranchisorDashboard() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) redirect('/onboarding');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Franchisor workspace</h1>
      <p className="text-muted-foreground">Dashboard and brand ops by role.</p>
      <nav className="flex flex-wrap gap-2">
        {hasModule(context, 'sales') && (
          <Link href="/franchisor/sales" className="text-primary underline">Sales</Link>
        )}
        <Link href="/franchisor/brand-ops" className="text-primary underline">Brand / Ops</Link>
        <Link href="/franchisor/franchisees" className="text-primary underline">Franchisees</Link>
        {hasModule(context, 'finance') && (
          <Link href="/franchisor/finance" className="text-primary underline">Finance</Link>
        )}
      </nav>
    </div>
  );
}
