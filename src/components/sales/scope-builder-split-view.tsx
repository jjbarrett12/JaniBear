'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Copy, FileDown, Lock, Unlock, Calculator } from 'lucide-react';

type Status = 'draft' | 'final' | 'locked';

export function ScopeBuilderSplitView() {
  const [status, setStatus] = useState<Status>('draft');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Save Scope
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
        {status === 'locked' ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setStatus('draft')}>
            <Unlock className="h-4 w-4" />
            Unlock
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setStatus('locked')}>
            <Lock className="h-4 w-4" />
            Lock
          </Button>
        )}
        <Link href="/app/proposals/build">
          <Button size="sm" className="gap-2">
            <Calculator className="h-4 w-4" />
            Generate Proposal
          </Button>
        </Link>
        <Badge variant={status === 'locked' ? 'secondary' : status === 'final' ? 'default' : 'outline'} className="capitalize">
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Areas / Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Define service areas and zones. (TODO: wire to scope model)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frequencies &amp; Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Templated and custom tasks with frequencies. (TODO)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Staffing &amp; Supplies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Staffing assumptions and supplies. (TODO)</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Labor &amp; Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labor hours</span>
                <span>—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rates</span>
                <span>—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplies cost</span>
                <span>—</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total monthly</span>
                <span>—</span>
              </div>
              <p className="text-xs text-muted-foreground">Margin slider (TODO)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change log</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Scope version history. (TODO)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
