import { createClient } from '@/lib/supabase/server';
import { getServerContextOrThrow } from '@/lib/auth/serverGuards';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { SeatDistributionClient } from './seat-distribution-client';

export const dynamic = 'force-dynamic';

const SEAT_ADMIN_ROLES = ['kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin'];

export default async function TeamSeatPage() {
  const ctx = await getServerContextOrThrow();
  const orgId = ctx.orgId;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', ctx.userId)
    .single();
  const role = (member?.role ?? '').toLowerCase();
  if (!SEAT_ADMIN_ROLES.includes(role)) {
    redirect('/app/forbidden');
  }

  const [membersRes, tokensRes, purchasesRes] = await Promise.all([
    supabase
      .from('org_members')
      .select('id, user_id, role, status, created_at, profiles(full_name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('org_seat_tokens')
      .select('id, plan, status, assigned_to_user_id')
      .eq('org_id', orgId),
    supabase.from('org_seat_purchases').select('*').eq('org_id', orgId).maybeSingle(),
  ]);

  const members = membersRes.data ?? [];
  const tokens = tokensRes.data ?? [];
  const purchases = purchasesRes.data;

  const availableByPlan: Record<string, number> = {};
  const assignedByPlan: Record<string, number> = {};
  for (const t of tokens) {
    const p = t.plan as string;
    if (t.status === 'available') availableByPlan[p] = (availableByPlan[p] ?? 0) + 1;
    if (t.status === 'assigned') assignedByPlan[p] = (assignedByPlan[p] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team & seat distribution</h1>
          <p className="text-muted-foreground mt-1">
            Assign seat tokens to members. Each member can have one plan. Change plan to revoke and assign a different token.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members & plans
          </CardTitle>
          <CardDescription>
            Current plan comes from their assigned seat token. Use &quot;Change plan&quot; to upgrade/downgrade (consumes an available token of the new plan).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeatDistributionClient
            orgId={orgId}
            members={members}
            tokens={tokens}
            availableByPlan={availableByPlan}
            purchases={purchases}
          />
        </CardContent>
      </Card>
    </div>
  );
}
