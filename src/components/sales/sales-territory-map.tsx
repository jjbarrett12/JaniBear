'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

export function SalesTerritoryMap() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Map className="h-5 w-5" />
          Territory map
        </CardTitle>
        <p className="text-xs text-muted-foreground">Leads clustered, hot zones, revenue density.</p>
      </CardHeader>
      <CardContent>
        <Link href="/app/map" className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 h-32 text-muted-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-foreground transition-colors">
          Open map →
        </Link>
      </CardContent>
    </Card>
  );
}
