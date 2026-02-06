'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ListOrdered, Target, CheckCircle, Loader2 } from 'lucide-react';
import { CHANNEL_LABELS } from '@/lib/sales-cadence-defaults';

interface LeadCadenceActionsProps {
  leadId: string;
  enrollment: {
    id: string;
    current_step: number;
    next_touch_at: string | null;
    status: string;
    template_id: string;
  } | null;
  touchLogCount: number;
  isInTop10: boolean;
  topTargetRank: number | null;
  defaultTemplateId: string | null;
}

export function LeadCadenceActions({
  leadId,
  enrollment,
  touchLogCount,
  isInTop10,
  topTargetRank,
  defaultTemplateId,
}: LeadCadenceActionsProps) {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [logging, setLogging] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logChannel, setLogChannel] = useState<string>('call');
  const [logNotes, setLogNotes] = useState('');

  const handleEnroll = async () => {
    if (!defaultTemplateId) return;
    setEnrolling(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setEnrolling(false);
      return;
    }
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();
    if (!membership?.org_id) {
      setEnrolling(false);
      return;
    }
    await supabase.from('lead_cadence_enrollments').insert({
      lead_id: leadId,
      template_id: defaultTemplateId,
      current_step: 1,
      status: 'active',
      created_by_user_id: user.id,
    });
    setEnrolling(false);
    router.refresh();
  };

  const handleLogTouch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLogging(false);
      return;
    }
    const nextStep = (enrollment?.current_step ?? touchLogCount) + 1;
    await supabase.from('lead_touch_log').insert({
      lead_id: leadId,
      step_number: nextStep,
      channel: logChannel,
      notes: logNotes || null,
      created_by_user_id: user.id,
    });
    if (enrollment?.id) {
      await supabase
        .from('lead_cadence_enrollments')
        .update({
          current_step: Math.min(nextStep, 10),
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);
    }
    setLogNotes('');
    setShowLogForm(false);
    setLogging(false);
    router.refresh();
  };

  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-base dark:text-white">Cadence & Top 10</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cadence */}
        <div>
          {enrollment ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Enrolled in cadence • Touch {enrollment.current_step} of 10
                {touchLogCount > 0 && ` (${touchLogCount} logged)`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogForm(!showLogForm)}
                >
                  Log a touch
                </Button>
                <Link href="/app/sales/cadence">
                  <Button variant="ghost" size="sm">View cadence</Button>
                </Link>
              </div>
              {showLogForm && (
                <form onSubmit={handleLogTouch} className="mt-3 p-3 rounded-lg border dark:border-gray-700 space-y-2">
                  <Label>Channel</Label>
                  <Select value={logChannel} onValueChange={setLogChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['email', 'call', 'linkedin', 'sms', 'meeting'] as const).map((ch) => (
                        <SelectItem key={ch} value={ch}>
                          {CHANNEL_LABELS[ch]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Left voicemail, sent follow-up..."
                    className="min-h-[60px] dark:bg-gray-800"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={logging}>
                      {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save touch'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowLogForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnroll}
                disabled={enrolling || !defaultTemplateId}
              >
                {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListOrdered className="h-4 w-4 mr-1" />}
                Enroll in 10-touch cadence
              </Button>
              {!defaultTemplateId && (
                <span className="text-xs text-gray-500">Create a cadence in Sales first.</span>
              )}
            </div>
          )}
        </div>

        {/* Top 10 */}
        <div>
          {isInTop10 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              In your Top 10 targets {topTargetRank != null && `(#${topTargetRank})`}
            </p>
            <Link href="/app/sales/top-targets">
              <Button variant="ghost" size="sm">Manage Top 10</Button>
            </Link>
          ) : (
            <Link href="/app/sales/top-targets">
              <Button size="sm" variant="outline">
                <Target className="h-4 w-4 mr-1" />
                Add to my Top 10
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
