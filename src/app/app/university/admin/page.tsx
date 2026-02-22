import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listCourses, listRequirements } from '@/actions/university-training';
import { Settings, BookOpen, ListChecks } from 'lucide-react';
import { UniversityAdminClient } from './university-admin-client';

export default async function UniversityAdminPage() {
  const org = await requireOrg();
  const canEdit = await canWriteOrg(org.org_id);
  if (!canEdit) redirect('/app/university');

  const { courses } = await listCourses(org.org_id);
  const { requirements } = await listRequirements(org.org_id);
  const orgCourses = (courses ?? []).filter((c) => c.org_id === org.org_id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/university" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to University
        </Link>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7" />
          University admin
        </h1>
        <p className="text-muted-foreground">
          Manage org courses and training requirements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Manage courses
          </CardTitle>
          <CardDescription>
            Create and edit org-specific courses. Global courses are managed by platform admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Org courses: {orgCourses.length}. Full CRUD UI can be added here (create/edit form, delete).
          </p>
          <UniversityAdminClient orgCourses={orgCourses} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Manage requirements
          </CardTitle>
          <CardDescription>
            Role-based and account/site-based required courses. Enforcement: hard gate or soft recommend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Current requirements: {requirements?.length ?? 0}. Add/edit requirement (role_key, account_id, required_course_ids, enforcement).
          </p>
          <ul className="space-y-1 text-sm">
            {(requirements ?? []).map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span className="font-medium">{r.requirement_type}</span>
                {r.role_key && <span>role: {r.role_key}</span>}
                {r.account_id && <span>account: {r.account_id.slice(0, 8)}…</span>}
                <span className="text-muted-foreground">{r.required_course_ids?.length ?? 0} courses</span>
                <span className="text-muted-foreground">{r.enforcement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
