'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import { appRoutes } from '@/lib/routes';

export function AuthzErrorActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6">
      <Button onClick={() => window.location.reload()} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
      <Button variant="outline" asChild className="gap-2">
        <Link href={appRoutes.dashboard()}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <Button variant="outline" asChild className="gap-2">
        <Link href="/contact">
          <Mail className="h-4 w-4" />
          Contact Support
        </Link>
      </Button>
    </div>
  );
}
