import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { Button } from '@/components/ui/button';

/**
 * Re-entry screen: "Continue as {user} @ {org}" when session exists.
 * Deep links and PWA can land here for a clear workspace entry.
 */
export default async function AppEntryPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const [userResult, orgResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('organizations').select('name').eq('id', org.org_id).maybeSingle(),
  ]);

  const user = userResult.data.user;
  const orgName = orgResult.data?.name ?? 'Workspace';

  if (!user) {
    redirect('/auth/login?redirect=/app/entry');
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="rounded-2xl border bg-card p-8 max-w-md w-full text-center shadow-lg">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Continue as <span className="font-medium text-foreground">{user.email}</span>
          <br />
          at <span className="font-medium text-foreground">{orgName}</span>
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/app/dashboard">Continue to workspace</Link>
        </Button>
      </div>
    </div>
  );
}
