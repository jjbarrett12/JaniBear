import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default async function UniversityComplianceAlertsPage() {
  const org = await requireOrg();
  const canEdit = await canWriteOrg(org.org_id);
  if (!canEdit) redirect('/app/university');

  const supabase = await createClient();
  const now = new Date().toISOString();
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: requirements } = await supabase
    .from('jb_training_requirements')
    .select('required_course_ids')
    .eq('org_id', org.org_id)
    .eq('enforcement', 'hard_gate');

  const requiredCourseIds = new Set<string>();
  (requirements ?? []).forEach((r) => (r.required_course_ids ?? []).forEach((id: string) => requiredCourseIds.add(id)));

  const { data: members } = await supabase.from('org_members').select('user_id').eq('org_id', org.org_id).eq('status', 'active');
  const userIds = (members ?? []).map((m) => m.user_id);

  const { data: certs } = await supabase
    .from('jb_training_certifications')
    .select('user_id, course_id, expires_at, status')
    .in('user_id', userIds)
    .in('course_id', requiredCourseIds.size > 0 ? Array.from(requiredCourseIds) : []);

  const expiring: { user_id: string; course_id: string; expires_at: string }[] = [];
  const overdue: { user_id: string; course_id: string }[] = [];
  (certs ?? []).forEach((c) => {
    if (c.status !== 'active') return;
    if (c.expires_at) {
      if (c.expires_at < now) overdue.push({ user_id: c.user_id, course_id: c.course_id });
      else if (c.expires_at <= in30) expiring.push({ user_id: c.user_id, course_id: c.course_id, expires_at: c.expires_at });
    }
  });

  const { data: courses } = await supabase.from('jb_training_courses').select('id, title').in('id', Array.from(requiredCourseIds));
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? '']));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/university" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">← Back to University</Link>
        <h1 className="text-2xl font-bold text-foreground">Compliance alerts</h1>
        <p className="text-muted-foreground">Expiring, overdue, and missing required training</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Expiring within 30 days</CardTitle>
          <CardDescription>{expiring.length} certification(s) expiring soon</CardDescription>
        </CardHeader>
        <CardContent>
          {expiring.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
            <ul className="space-y-2">
              {expiring.slice(0, 20).map((e, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{profileMap.get(e.user_id) || e.user_id.slice(0, 8)}</span>
                  <span className="text-sm text-muted-foreground">{courseMap.get(e.course_id) ?? e.course_id}</span>
                  <span className="text-sm">Expires {new Date(e.expires_at).toLocaleDateString()}</span>
                  <Button variant="outline" size="sm" asChild><Link href={`/app/university/course/${e.course_id}`}>Assign training</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Overdue required</CardTitle>
          <CardDescription>{overdue.length} certification(s) past expiry</CardDescription>
        </CardHeader>
        <CardContent>
          {overdue.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
            <ul className="space-y-2">
              {overdue.slice(0, 20).map((o, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 p-3">
                  <span className="font-medium">{profileMap.get(o.user_id) || o.user_id.slice(0, 8)}</span>
                  <span className="text-sm text-muted-foreground">{courseMap.get(o.course_id) ?? o.course_id}</span>
                  <Badge variant="destructive">Overdue</Badge>
                  <Button variant="outline" size="sm" asChild><Link href={`/app/university/course/${o.course_id}`}>Assign training</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">Bulk actions: Remind (stub), Assign training — to be wired in a follow-up.</p>
    </div>
  );
}
