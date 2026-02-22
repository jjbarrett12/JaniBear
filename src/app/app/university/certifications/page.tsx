import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listCertificationsForUser } from '@/actions/university-training';
import { Award } from 'lucide-react';

export default async function UniversityCertificationsPage() {
  const org = await requireOrg();
  const canEdit = await canWriteOrg(org.org_id);
  const { certifications } = await listCertificationsForUser(org.org_id);

  const now = new Date().toISOString();
  const active = (certifications ?? []).filter((c) => c.status === 'active' && (!c.expires_at || c.expires_at >= now));
  const expired = (certifications ?? []).filter((c) => c.status === 'expired' || (c.expires_at && c.expires_at < now));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/university" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to University
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Certifications</h1>
        <p className="text-muted-foreground">
          Your earned certifications and expiry dates
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            My certifications
          </CardTitle>
          <CardDescription>
            {active.length} active, {expired.length} expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Active</h3>
              <ul className="space-y-2">
                {active.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/app/university/course/${c.course_id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <span className="font-medium">{c.course?.title ?? 'Course'}</span>
                      <div className="flex items-center gap-2">
                        {c.expires_at && (
                          <span className="text-sm text-muted-foreground">
                            Expires {new Date(c.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        <Badge variant="default">Active</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {expired.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Expired</h3>
              <ul className="space-y-2">
                {expired.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/app/university/course/${c.course_id}`}
                      className="flex items-center justify-between rounded-lg border border-muted p-3 hover:bg-muted/30"
                    >
                      <span className="font-medium text-muted-foreground">{c.course?.title ?? 'Course'}</span>
                      <Badge variant="secondary">Expired</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {certifications?.length === 0 && (
            <p className="text-sm text-muted-foreground">No certifications yet. Complete courses to earn certifications.</p>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <p className="text-sm text-muted-foreground">
          <Link href="/app/university/skill-matrix" className="text-primary hover:underline">
            View org skill matrix
          </Link>
          {' · '}
          <Link href="/app/university/compliance-alerts" className="text-primary hover:underline">
            Compliance alerts
          </Link>
        </p>
      )}
    </div>
  );
}
