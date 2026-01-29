import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-8">
        <CardContent className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}
