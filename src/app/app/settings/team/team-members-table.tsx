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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ASSIGNABLE_ROLES, type AssignableRole } from '@/actions/team';
import { Loader2, KeyRound, UserX, UserCheck } from 'lucide-react';

export type MemberRow = {
  id: string;
  user_id: string;
  role: string;
  status: string | null;
  profiles: { full_name?: string } | null;
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager / Supervisor',
  sales_rep: 'Sales rep',
  sales: 'Sales',
  ops: 'Operations',
  inspector: 'Inspector',
  cleaner: 'Cleaner',
  client_viewer: 'Client viewer',
  client: 'Client',
};

export function TeamMembersTable({
  members,
  currentUserId,
  updateMemberRole,
}: {
  members: MemberRow[];
  currentUserId: string;
  updateMemberRole: (membershipId: string, newRole: string) => Promise<{ error?: string }>;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleRoleChange(membershipId: string, newRole: string) {
    setUpdating(membershipId);
    try {
      const result = await updateMemberRole(membershipId, newRole);
      if (result.error) alert(result.error);
    } finally {
      setUpdating(null);
    }
  }

  async function handleResetPassword(membershipId: string) {
    setActionLoading(`reset-${membershipId}`);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? 'Failed to send reset email');
      else alert('Password reset email sent.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisable(membershipId: string) {
    setActionLoading(`disable-${membershipId}`);
    try {
      const res = await fetch('/api/admin/users/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? 'Failed');
      else window.location.reload();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEnable(membershipId: string) {
    setActionLoading(`enable-${membershipId}`);
    try {
      const res = await fetch('/api/admin/users/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? 'Failed');
      else window.location.reload();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              {(m.profiles as { full_name?: string } | null)?.full_name ?? m.user_id}
            </TableCell>
            <TableCell>
              {m.role === 'owner' ? (
                <Badge variant="secondary">{ROLE_LABELS.owner ?? m.role}</Badge>
              ) : (
                <Select
                  value={m.role}
                  disabled={updating === m.id}
                  onValueChange={(value) => handleRoleChange(m.id, value)}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    {updating === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue placeholder="Role" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={m.status === 'active' ? 'default' : 'outline'}>
                {m.status ?? 'active'}
              </Badge>
            </TableCell>
            <TableCell className="text-right flex items-center justify-end gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={!!actionLoading}
                onClick={() => handleResetPassword(m.id)}
              >
                {actionLoading === `reset-${m.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-1" />
                    Reset password
                  </>
                )}
              </Button>
              {m.status === 'active' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={!!actionLoading || m.user_id === currentUserId}
                  onClick={() => handleDisable(m.id)}
                >
                  {actionLoading === `disable-${m.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserX className="h-4 w-4 mr-1" />
                      Disable
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={!!actionLoading}
                  onClick={() => handleEnable(m.id)}
                >
                  {actionLoading === `enable-${m.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
