import { requireOrg } from '@/lib/auth';
import { isPremiumPlan } from '@/lib/is-premium';
import { getCourseBySlug, getAllCourseSlugs } from '@/lib/university/courses';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Square, Settings, GraduationCap, ArrowLeft, BookOpen, Lightbulb, Wrench } from 'lucide-react';

const iconMap = {
  Layers,
  Square,
  Settings,
};

export async function generateStaticParams() {
  return getAllCourseSlugs().map((slug) => ({ slug }));
}

export default async function UniversityCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await requireOrg();
  const premium = await isPremiumPlan(org.org_id);
  const course = getCourseBySlug(slug);

  if (!course) notFound();
  if (!premium) {
    return (
      <div className="space-y-6">
        <Link href="/app/university">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to University
          </Button>
        </Link>
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Premium required</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              This course is part of Jani-Bear University, included with Grizzly and Kodiak plans. Upgrade to unlock all courses.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/pricing">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">View plans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = iconMap[course.icon as keyof typeof iconMap] ?? GraduationCap;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/app/university">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to University
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Badge variant="secondary">{course.totalLessons} lessons</Badge>
          <span>~{course.estimatedTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
          <Icon className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {course.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
        </div>
      </div>

      <div className="space-y-6">
        {course.lessons.map((lesson, index) => (
          <Card key={lesson.id} className="relative dark:bg-gray-800 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-600" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-sm font-semibold">
                  {index + 1}
                </span>
                <CardTitle className="text-lg dark:text-white">{lesson.title}</CardTitle>
                <Badge variant="outline" className="ml-auto text-xs">
                  {lesson.duration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {lesson.content.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-gray-600 dark:text-gray-400 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {lesson.tips && lesson.tips.length > 0 && (
                <div className="flex gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800">
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 text-sm mb-1">Pro tips</p>
                    <ul className="list-disc list-inside text-sm text-amber-800/90 dark:text-amber-200/90 space-y-1">
                      {lesson.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {lesson.equipment && lesson.equipment.length > 0 && (
                <div className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <Wrench className="h-5 w-5 text-gray-600 dark:text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-1">Equipment & supplies</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      {lesson.equipment.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Link href="/app/university">
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Back to all courses
          </Button>
        </Link>
      </div>
    </div>
  );
}
