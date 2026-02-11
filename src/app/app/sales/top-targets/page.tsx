import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Plus, Mail, Phone, Building2, User } from 'lucide-react';
import { TopTargetCard } from '@/components/sales/top-target-card';

type LeadOption = { id: string; contact_name: string | null; company: string | null; email: string | null; phone: string | null; status: string | null };
type TopTargetRow = { id: string; rank: number; notes: string | null; relationship_notes: string | null; lead_id: string; leads: LeadOption | LeadOption[] | null };

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
  { key: 'walkthrough_scheduled', label: 'Walk-through Scheduled', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' },
  { key: 'walkthrough_done', label: 'Walk-through Done', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' },
  { key: 'won', label: 'Won', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' },
  { key: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
];

export default async function TopTargetsPage() {
  const org = await requireOrg();
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: topTargets } = await supabase
    .from('top_targets')
    .select(`
      id,
      rank,
      notes,
      relationship_notes,
      lead_id,
      leads (
        id,
        contact_name,
        company,
        email,
        phone,
        address,
        city,
        state,
        zip,
        status,
        notes,
        created_at
      )
    `)
    .eq('org_id', org.org_id)
    .eq('user_id', user?.id ?? '')
    .order('rank', { ascending: true });

  const slots = Array.from({ length: 10 }, (_, i) => i + 1);
  const rows = (topTargets || []) as TopTargetRow[];
  const byRank = rows.reduce<Record<number, TopTargetRow>>((acc, row) => {
    acc[row.rank] = row;
    return acc;
  }, {});
  const assignedLeadIds = new Set(rows.map((t) => t.lead_id));

  const { data: leads } = await supabase
    .from('leads')
    .select('id, contact_name, company, email, phone, status')
    .eq('org_id', org.org_id)
    .order('company')
    .limit(500);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/sales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            My Top 10 Targets
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Focus on relationship selling with your top prospects for the year
          </p>
        </div>
      </div>

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Target className="h-5 w-5" />
            Top 10 pipeline
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add leads to slots 1–10. Keep contact info and relationship notes up to date so you can prioritize outreach.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {slots.map((rank) => {
              const row = byRank[rank];
              const rawLead = row?.leads;
              const raw: LeadOption | null | undefined = rawLead == null ? undefined : Array.isArray(rawLead) ? rawLead[0] ?? null : rawLead;
              const lead: LeadOption | null | undefined = raw ? { ...raw, status: raw.status ?? null } : raw;
              const target = row ? { ...row, leads: lead ?? null } : undefined;
              return (
                <TopTargetCard
                  key={rank}
                  rank={rank}
                  target={target}
                  lead={lead ?? undefined}
                  allLeads={(leads || []).filter((l) => !assignedLeadIds.has(l.id) || (lead?.id === l.id))}
                  stages={STAGES}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href="/app/sales">
          <Button variant="outline">Back to Sales</Button>
        </Link>
        <Link href="/app/sales/leads/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add new lead
          </Button>
        </Link>
      </div>
    </div>
  );
}
