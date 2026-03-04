import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listCourses, listEnrollmentsForUser } from '@/actions/university-training';
import { GraduationCap, Lock } from 'lucide-react';
import { isPremiumPlan } from '@/lib/is-premium';

export default async function UniversityCatalogPage() {
  const org = await requireOrg();
  const premium = await isPremiumPlan(org.org_id);
  const { courses } = await listCourses(org.org_id);
  const { enrollments } = await listEnrollmentsForUser(org.org_id);
  const enrollmentByCourse = new Map((enrollments ?? []).map((e) => [e.course_id, e]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/university" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to University
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Course catalog</h1>
        <p className="text-muted-foreground">
          Browse by category, level, and language. Start or continue any course.
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No courses available yet. Platform courses will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const enrollment = enrollmentByCourse.get(course.id);
            const isGated =
              (course.premium_tier === 'grizzly' || course.premium_tier === 'kodiak') && !premium;
            const progress =
              enrollment?.status === 'completed'
                ? 100
                : enrollment?.status === 'in_progress'
                  ? 50
                  : 0;

            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <GraduationCap className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {course.premium_tier !== 'free' && (
                        <Badge variant="secondary" className="text-xs">
                          {course.premium_tier}
                        </Badge>
                      )}
                      {enrollment && (
                        <Badge variant={enrollment.status === 'completed' ? 'default' : 'outline'}>
                          {enrollment.status === 'completed' ? 'Done' : 'In progress'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base">
                    <Link
                      href={isGated ? '#' : `/app/university/course/${course.id}`}
                      className={isGated ? 'cursor-not-allowed' : 'hover:underline'}
                    >
                      {course.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{course.description ?? ''}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{course.estimated_minutes} min · {course.level}</span>
                  </div>
                  {enrollment && enrollment.status !== 'completed' && (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  {isGated ? (
                    <div className="mt-2 flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
                      <Lock className="h-4 w-4" />
                      Upgrade to access
                    </div>
                  ) : (
                    <Link
                      href={`/app/university/course/${course.id}`}
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {enrollment?.status === 'completed' ? 'View' : enrollment ? 'Continue' : 'Start'} →
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
