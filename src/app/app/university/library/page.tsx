import { requireOrg } from '@/lib/auth';
import { canWriteOrg } from '@/lib/auth';
import { isPremiumPlan } from '@/lib/is-premium';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  ArrowRight,
  FolderOpen,
  Settings,
  Layers,
  FlaskConical,
  Users,
  Plane,
  GraduationCap,
} from 'lucide-react';
import { universityCourses } from '@/lib/university/courses';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'floor-care': Layers,
  'terminal-cleaning': Plane,
  'chemical-sds': FlaskConical,
  'customer-service': Users,
};

export default async function UniversityLibraryPage() {
  const org = await requireOrg();
  const premium = await isPremiumPlan(org.org_id);
  const canEdit = await canWriteOrg(org.org_id);
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('university_categories')
    .select('id, name, slug, sort_order')
    .eq('org_id', org.org_id)
    .order('sort_order');

  const { data: folderCounts } = categories?.length
    ? await supabase
        .from('university_folders')
        .select('category_id')
        .in('category_id', categories.map((c) => c.id))
    : { data: [] };

  const countByCategory: Record<string, number> = {};
  folderCounts?.forEach((f) => {
    countByCategory[f.category_id] = (countByCategory[f.category_id] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/app/university" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to University
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Training Library
          </h1>
          <p className="text-muted-foreground">
            Your team&apos;s training library: Floor Care, SDS, Customer Service, and more
          </p>
        </div>
        {canEdit && (
          <Link href="/app/university/manage">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage categories & uploads
            </Button>
          </Link>
        )}
      </div>

      {!premium ? (
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Premium feature</CardTitle>
                <CardDescription>
                  Training library and Jani-Bear courses are included with Grizzly and Kodiak plans.
                  Upgrade to unlock.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/pricing">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                View plans & upgrade
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {categories && categories.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Your training library</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat) => {
                  const Icon = categoryIcons[cat.slug] ?? FolderOpen;
                  return (
                    <Link key={cat.id} href={`/app/university/library/${cat.slug}`}>
                      <Card className="h-full border hover:border-amber-500/50 transition-colors cursor-pointer group">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                              <Icon className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {countByCategory[cat.id] ?? 0} folders
                            </Badge>
                          </div>
                          <CardTitle className="text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
                            {cat.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            Open
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Jani-Bear courses</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Standard courses on carpet care, floor maintenance, and equipment operation.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {universityCourses.map((course) => (
                <Link key={course.slug} href={`/app/university/courses/${course.slug}`}>
                  <Card className="relative h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group dark:bg-card">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-t-lg" />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {course.totalLessons} lessons
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {course.title}
                      </CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>~{course.estimatedTime}</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          Start course
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
