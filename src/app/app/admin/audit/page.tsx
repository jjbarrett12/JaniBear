import { Suspense } from 'react';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { AdminAuditClient } from '@/components/admin/admin-audit-client';
import { Skeleton } from '@/components/ui/skeleton';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string }>;
}) {
  const org = await requireOrg();
  const params = await searchParams;
  const supabase = await createClient();

  const from = params.from ? new Date(params.from) : null;
  const to = params.to ? new Date(params.to) : null;

  let query = supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, actor_user_id, created_at, before_state, after_state')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.action?.trim()) {
    query = query.eq('action', params.action.trim());
  }
  if (from) {
    query = query.gte('created_at', from.toISOString());
  }
  if (to) {
    query = query.lte('created_at', to.toISOString());
  }

  const { data: rows } = await query;

  const events = (rows ?? []).map((r) => ({
    id: r.id,
    action: r.action ?? '—',
    entity_type: r.entity_type ?? '—',
    entity_id: r.entity_id ?? null,
    actor_user_id: r.actor_user_id ?? null,
    created_at: r.created_at ?? null,
    meta: { before: r.before_state, after: r.after_state },
  }));

  return (
    <AdminPageLayout
      title="Audit Log"
      description="Key actions (role changes, user updates, settings) for compliance and security."
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <AdminAuditClient initialEvents={events} />
        </Suspense>
      </div>
    </AdminPageLayout>
  );
}

export function Loading() {
  return (
    <AdminPageLayout title="Audit Log" description="Key actions for compliance and security.">
      <Skeleton className="h-96 rounded-2xl" />
    </AdminPageLayout>
  );
}
