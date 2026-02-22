import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function UniversitySkillMatrixPage() {
  const org = await requireOrg();
  const canEdit = await canWriteOrg(org.org_id);
  const supabase = await createClient();

  const { data: requirements } = await supabase
    .from('jb_training_requirements')
    .select('required_course_ids')
    .eq('org_id', org.org_id);
  const requiredCourseIds = new Set<string>();
  (requirements ?? []).forEach((r) => (r.required_course_ids ?? []).forEach((id: string) => requiredCourseIds.add(id)));

  const courseIds = requiredCourseIds.size > 0 ? Array.from(requiredCourseIds) : [];
  const { data: courses } = courseIds.length > 0
    ? await supabase.from('jb_training_courses').select('id, title').in('id', courseIds)
    : { data: [] };

  const { data: members } = await supabase
    .from('org_members')
    .select('user_id, role')
    .eq('org_id', org.org_id)
    .eq('status', 'active');

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  const { data: certs } = await supabase
    .from('jb_training_certifications')
    .select('user_id, course_id, status, expires_at')
    .in('user_id', userIds)
    .in('course_id', courseIds);

  const now = new Date().toISOString();
  const certMap = new Map<string, 'active' | 'expired'>();
  (certs ?? []).forEach((c) => {
    const key = `${c.user_id}:${c.course_id}`;
    if (c.status === 'active' && (!c.expires_at || c.expires_at >= now)) certMap.set(key, 'active');
    else certMap.set(key, 'expired');
  });

  const courseList = (courses ?? []).slice(0, 8);
  const userList = (members ?? []).map((m) => {
    const p = (profiles ?? []).find((x) => x.id === m.user_id);
    return { user_id: m.user_id, name: (p?.full_name ?? '').trim() || m.user_id.slice(0, 8), role: m.role };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/university" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to University
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Skill matrix</h1>
        <p className="text-muted-foreground">Certification status by user and required course</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Compliance by user</CardTitle>
          <CardDescription>Certified, Expired, or Missing for key courses</CardDescription>
        </CardHeader>
        <CardContent>
          {courseList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No required courses configured. Set requirements in Admin.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    {courseList.map((c) => (
                      <TableHead key={c.id} className="min-w-[100px]">
                        {c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userList.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      {courseList.map((c) => {
                        const status = certMap.get(`${u.user_id}:${c.id}`);
                        return (
                          <TableCell key={c.id}>
                            {status === 'active' && <Badge variant="default">Certified</Badge>}
                            {status === 'expired' && <Badge variant="secondary">Expired</Badge>}
                            {!status && <Badge variant="outline">Missing</Badge>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {canEdit && (
        <Link href="/app/university/admin">
          <span className="text-sm text-primary hover:underline">Manage requirements in Admin</span>
        </Link>
      )}
    </div>
  );
}
