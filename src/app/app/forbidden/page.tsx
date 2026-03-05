import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <ShieldAlert className="h-16 w-16 text-amber-500 mb-4" aria-hidden />
      <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        You don&apos;t have permission to view this page.
      </p>
      <Button asChild className="mt-6">
        <Link href="/app/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
