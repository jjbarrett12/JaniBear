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
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <Link href="/app/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/settings">Switch organization</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm mt-6 text-center max-w-sm">
        If you believe you should have access, contact your organization admin.
      </p>
    </div>
  );
}
