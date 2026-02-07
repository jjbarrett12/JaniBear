import { requireOrg } from '@/lib/auth';
import { isPremiumPlan } from '@/lib/is-premium';
import { universityCourses } from '@/lib/university/courses';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Square, Settings, GraduationCap, Lock, ArrowRight } from 'lucide-react';

const iconMap = {
  Layers,
  Square,
  Settings,
};

export default async function UniversityPage() {
  const org = await requireOrg();
  const premium = await isPremiumPlan(org.org_id);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Jani-Bear University
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Training for carpet care, floor maintenance, and equipment operation
            </p>
          </div>
        </div>
      </div>

      {!premium ? (
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Premium feature
                </CardTitle>
                <CardDescription>
                  Jani-Bear University is included with Grizzly and Kodiak plans. Upgrade to unlock courses on carpet extraction, floor buffing & stripping, and equipment operation.
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
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Learn best practices for carpet extraction, hard floor buffing and stripping, and safe operation of commercial janitorial equipment. Complete each course at your own pace.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {universityCourses.map((course) => {
              const Icon = iconMap[course.icon as keyof typeof iconMap] ?? GraduationCap;
              return (
                <Link key={course.slug} href={`/app/university/courses/${course.slug}`}>
                  <Card className="relative h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group dark:bg-gray-800">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-t-lg" />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {course.totalLessons} lessons
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors dark:text-white">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>~{course.estimatedTime}</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          Start course
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
