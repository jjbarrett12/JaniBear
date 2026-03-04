import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

/**
 * Shown when an authenticated user who is not a platform admin tries to access /platform/*.
 */
export default function PlatformForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <ShieldX className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-semibold text-foreground mb-2">Access denied</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Platform admin access is restricted. You do not have permission to view this area.
      </p>
      <Link href="/app/dashboard">
        <Button variant="default">Back to dashboard</Button>
      </Link>
    </div>
  );
}
