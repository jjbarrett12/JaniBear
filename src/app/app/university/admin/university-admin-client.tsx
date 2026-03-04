'use client';

import { Button } from '@/components/ui/button';
import type { JbTrainingCourse } from '@/lib/university-training/types';
import Link from 'next/link';

export function UniversityAdminClient({ orgCourses }: { orgCourses: JbTrainingCourse[] }) {
  return (
    <div className="space-y-2">
      {orgCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No org-specific courses yet. Platform courses are read-only here.</p>
      ) : (
        <ul className="space-y-1">
          {orgCourses.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded border p-2">
              <span className="font-medium">{c.title}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/university/course/${c.id}`}>View</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Create course form (stub): add in a follow-up with server action for insert.</p>
    </div>
  );
}
