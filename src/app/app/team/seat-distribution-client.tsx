'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  cub: 'Cub',
  super_cub: 'Super-Cub',
  grizzly: 'Grizzly',
  super_grizzly: 'Super-Grizzly',
  kodiak: 'Kodiak',
  super_kodiak: 'Super-Kodiak',
  owner: 'Owner',
  admin: 'Admin',
};

const PLANS = ['cub', 'super_cub', 'grizzly', 'super_grizzly', 'kodiak', 'super_kodiak'] as const;

type Member = {
  id: string;
  user_id: string;
  role: string;
  status: string | null;
  created_at: string;
  profiles: { full_name?: string } | null;
};

type Token = {
  id: string;
  plan: string;
  status: string;
  assigned_to_user_id: string | null;
};

export function SeatDistributionClient({
  orgId,
  members,
  tokens,
  availableByPlan,
  purchases,
}: {
  orgId: string;
  members: Member[];
  tokens: Token[];
  availableByPlan: Record<string, number>;
  purchases: Record<string, unknown> | null;
}) {
  const [changingUserId, setChangingUserId] = useState<string | null>(null);

  async function handleChangePlan(userId: string, newPlan: string) {
    setChangingUserId(userId);
    try {
      const res = await fetch('/api/org/tokens/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, user_id: userId, new_plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Failed to change plan');
        return;
      }
      window.location.reload();
    } finally {
      setChangingUserId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Current plan</TableHead>
            <TableHead>Change plan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const currentPlan = (m.role ?? '').toLowerCase();
            const isChanging = changingUserId === m.user_id;
            return (
              <TableRow key={m.id}>
                <TableCell>
                  {(m.profiles as { full_name?: string } | null)?.full_name ?? m.user_id}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{PLAN_LABELS[currentPlan] ?? currentPlan}</span>
                </TableCell>
                <TableCell>
                  <Select
                    value={currentPlan}
                    onValueChange={(v) => handleChangePlan(m.user_id, v)}
                    disabled={isChanging}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => {
                        const avail = availableByPlan[p] ?? 0;
                        const hasToken = currentPlan === p;
                        const canSelect = hasToken || avail > 0;
                        return (
                          <SelectItem
                            key={p}
                            value={p}
                            disabled={!canSelect}
                          >
                            {PLAN_LABELS[p]} {!hasToken && avail > 0 ? `(${avail} available)` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {isChanging && <Loader2 className="inline h-4 w-4 animate-spin ml-2" />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="text-sm text-muted-foreground">
        Available tokens by plan: {PLANS.map((p) => `${PLAN_LABELS[p]} (${availableByPlan[p] ?? 0})`).join(', ')}
      </p>
    </div>
  );
}
