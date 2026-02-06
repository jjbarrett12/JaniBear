'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Target, Mail, Phone, Building2, User, Loader2, Trash2 } from 'lucide-react';

interface LeadOption {
  id: string;
  contact_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
}

interface TopTargetCardProps {
  rank: number;
  target: {
    id: string;
    rank: number;
    notes: string | null;
    relationship_notes: string | null;
    lead_id: string;
    leads: LeadOption | null;
  } | undefined;
  lead: LeadOption | null | undefined;
  allLeads: LeadOption[];
  stages: { key: string; label: string; color: string }[];
}

export function TopTargetCard({ rank, target, lead, allLeads, stages }: TopTargetCardProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [relationshipNotes, setRelationshipNotes] = useState(target?.relationship_notes ?? '');

  const availableLeads = lead ? [] : allLeads;

  const handleAddToSlot = async (leadId: string) => {
    setAdding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAdding(false);
      return;
    }
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();
    if (!membership?.org_id) {
      setAdding(false);
      return;
    }
    await supabase.from('top_targets').upsert(
      {
        org_id: membership.org_id,
        user_id: user.id,
        lead_id: leadId,
        rank,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,user_id,rank' }
    );
    setAdding(false);
    router.refresh();
  };

  const handleRemoveFromSlot = async () => {
    if (!target?.id) return;
    const supabase = createClient();
    await supabase.from('top_targets').delete().eq('id', target.id);
    router.refresh();
  };

  const handleSaveRelationshipNotes = async () => {
    if (!target?.id) return;
    setSavingNotes(true);
    const supabase = createClient();
    await supabase
      .from('top_targets')
      .update({
        relationship_notes: relationshipNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', target.id);
    setSavingNotes(false);
    router.refresh();
  };

  const stageConfig = lead?.status ? stages.find((s) => s.key === lead.status) : null;

  return (
    <Card className="dark:bg-gray-800/50 border-2 border-dashed dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {rank}
          </span>
          {target && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-red-600"
              onClick={handleRemoveFromSlot}
              title="Remove from Top 10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!lead ? (
          <div className="space-y-2">
            <Select
              onValueChange={(value) => {
                if (value) handleAddToSlot(value);
              }}
              disabled={adding}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add a target..." />
              </SelectTrigger>
              <SelectContent>
                {availableLeads.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-gray-500">
                    No leads to add. Create a lead first.
                  </div>
                ) : (
                  availableLeads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.company || l.contact_name || l.email || 'Unnamed'} {l.contact_name && `(${l.contact_name})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {adding && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding…
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Or <Link href="/app/sales/leads/new" className="text-primary hover:underline">create a new lead</Link> and add them here.
            </p>
          </div>
        ) : (
          <>
            <Link href={`/app/sales/leads/${lead.id}`} className="block group">
              <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary truncate">
                {lead.contact_name || 'Unnamed'}
              </p>
              {lead.company && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {lead.company}
                </p>
              )}
              {lead.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  {lead.email}
                </p>
              )}
              {lead.phone && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                  <Phone className="h-3 w-3 shrink-0" />
                  {lead.phone}
                </p>
              )}
            </Link>
            {stageConfig && (
              <Badge variant="secondary" className={stageConfig.color}>
                {stageConfig.label}
              </Badge>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                Relationship notes
              </label>
              <Textarea
                placeholder="Key contacts, next steps, interests..."
                value={relationshipNotes}
                onChange={(e) => setRelationshipNotes(e.target.value)}
                onBlur={handleSaveRelationshipNotes}
                disabled={savingNotes}
                className="min-h-[80px] text-sm resize-none dark:bg-gray-800 dark:border-gray-700"
              />
              {savingNotes && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving…
                </p>
              )}
            </div>
            <Link href={`/app/sales/leads/${lead.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View lead
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
