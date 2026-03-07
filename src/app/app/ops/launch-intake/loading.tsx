import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LaunchIntakeLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-4 w-full max-w-xl mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full max-w-lg mt-1" />
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <Skeleton className="h-5 w-44" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
