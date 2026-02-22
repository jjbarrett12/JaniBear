'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { enrollInCourse } from '@/actions/university-training';

interface Lesson {
  id: string;
  title: string;
  sortOrder: number;
}

export function UniversityCourseClient({
  courseId,
  courseTitle,
  lessons,
  enrollmentId,
  enrollmentStatus,
}: {
  courseId: string;
  courseTitle: string;
  lessons: Lesson[];
  enrollmentId?: string;
  enrollmentStatus?: string;
}) {
  const [enrolling, setEnrolling] = useState(false);
  const hasEnrollment = !!enrollmentId && enrollmentStatus !== 'completed';

  const handleStart = async () => {
    if (enrollmentId) {
      window.location.href = `/app/university/course/${courseId}?lesson=${lessons[0]?.id ?? ''}`;
      return;
    }
    setEnrolling(true);
    const { error } = await enrollInCourse(courseId);
    setEnrolling(false);
    if (!error) {
      window.location.href = `/app/university/course/${courseId}?lesson=${lessons[0]?.id ?? ''}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lessons</CardTitle>
        <CardDescription>
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}. Complete in order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons yet.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((l, i) => (
              <li key={l.id}>
                <Link
                  href={`/app/university/course/${courseId}?lesson=${l.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {i + 1}. {l.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button onClick={handleStart} disabled={enrolling}>
          {enrollmentStatus === 'completed' ? 'Review' : hasEnrollment ? 'Continue' : 'Start course'}
        </Button>
      </CardContent>
    </Card>
  );
}
