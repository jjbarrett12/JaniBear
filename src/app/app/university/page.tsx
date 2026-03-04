import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  BookOpen,
  Award,
  AlertTriangle,
  Clock,
  ChevronRight,
  FolderOpen,
  ListChecks,
} from 'lucide-react';
import { getOverviewKpis, listCourses, listEnrollmentsForUser, listCertificationsForUser, listRecommendations, listRequirements } from '@/actions/university-training';

export default async function UniversityPage() {
  const org = await requireOrg();
  const canEdit = await canWriteOrg(org.org_id);

  const [kpis, coursesResult, enrollmentsResult, certsResult, recsResult, reqsResult] = await Promise.all([
    getOverviewKpis(org.org_id),
    listCourses(org.org_id),
    listEnrollmentsForUser(org.org_id),
    listCertificationsForUser(org.org_id),
    listRecommendations(org.org_id),
    listRequirements(org.org_id),
  ]);

  const { courses } = coursesResult;
  const { certifications } = certsResult;
  const { recommendations } = recsResult;
  const { requirements } = reqsResult;

  const requiredCourseIds = new Set<string>();
  (requirements ?? []).forEach((r) => (r.required_course_ids ?? []).forEach((id: string) => requiredCourseIds.add(id)));
  let requiredCourses = (courses ?? []).filter((c) => requiredCourseIds.has(c.id)).slice(0, 8);
  if (requiredCourses.length === 0 && (courses ?? []).length > 0) {
    requiredCourses = (courses ?? []).slice(0, 3);
  }

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCerts = (certifications ?? []).filter(
    (c) => c.status === 'active' && c.expires_at && c.expires_at >= now.toISOString() && c.expires_at <= in30.toISOString()
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              JANIBEAR University
            </h1>
            <p className="text-muted-foreground">
              Training, compliance, and certifications
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/university/catalog">
            <Button variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Catalog
            </Button>
          </Link>
          <Link href="/app/university/my-training">
            <Button variant="outline" size="sm">
              <ListChecks className="h-4 w-4 mr-2" />
              My Training
            </Button>
          </Link>
          <Link href="/app/university/library">
            <Button variant="ghost" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Library
            </Button>
          </Link>
          {canEdit && (
            <Link href="/app/university/admin">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Company compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {kpis.compliancePct != null ? `${kpis.compliancePct}%` : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Overdue trainings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{kpis.overdueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Expiring in 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{kpis.expiringIn30Count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg completion time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {kpis.avgCompletionMinutes != null ? `${kpis.avgCompletionMinutes} min` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required courses (org) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Required courses</CardTitle>
            <Link href="/app/university/catalog">
              <Button variant="ghost" size="sm">
                View catalog <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <CardDescription>
            Courses required for your role or assigned accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requiredCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No required courses configured. Browse the catalog.</p>
          ) : (
            <ul className="space-y-2">
              {requiredCourses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/app/university/course/${c.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="font-medium">{c.title}</span>
                    <span className="text-sm text-muted-foreground">{c.estimated_minutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Expiring certifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expiring certifications</CardTitle>
            <Link href="/app/university/certifications">
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {expiringCerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certifications expiring in the next 30 days.</p>
          ) : (
            <ul className="space-y-2">
              {expiringCerts.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/app/university/course/${c.course_id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="font-medium">{c.course?.title ?? 'Course'}</span>
                    <span className="text-sm text-muted-foreground">
                      Expires {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Recommended by performance signals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recommended for you</CardTitle>
            <Link href="/app/university/catalog">
              <Button variant="ghost" size="sm">
                Browse catalog <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <CardDescription>
            Based on inspection results, complaints, or SLA signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recommendations || recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommendations right now.</p>
          ) : (
            <ul className="space-y-2">
              {recommendations.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/app/university/course/${r.course_id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <span className="font-medium">{r.course?.title ?? 'Course'}</span>
                    {r.reason && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{r.reason}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/app/university/certifications" className="text-primary hover:underline">
          Certifications
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/app/university/skill-matrix" className="text-primary hover:underline">
          Skill matrix
        </Link>
        {canEdit && (
          <>
            <span className="text-muted-foreground">·</span>
            <Link href="/app/university/compliance-alerts" className="text-primary hover:underline">
              Compliance alerts
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
