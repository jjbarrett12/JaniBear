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
import { ASSIGNABLE_ROLES } from '@/lib/team-roles';
import { Loader2, UserX } from 'lucide-react';

type Member = {
  id: string;
  user_id: string;
  role: string;
  status: string | null;
  created_at: string;
  name: string | null;
};

const ROLE_OPTIONS = ['owner', ...ASSIGNABLE_ROLES];
const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  sales_rep: 'Sales rep',
  sales: 'Sales',
  ops: 'Operations',
  inspector: 'Inspector',
  cleaner: 'Crew',
  client_viewer: 'Client viewer',
};

export function AdminUsersTab({
  orgId,
  members,
  loading,
  onUpdate,
}: {
  orgId: string;
  members: Member[];
  loading: boolean;
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdating(memberId);
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? 'Failed to update role');
      else onUpdate();
    } finally {
      setUpdating(null);
    }
  }

  async function handleStatusChange(memberId: string, status: 'active' | 'suspended') {
    setUpdating(memberId);
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? 'Failed to update status');
      else onUpdate();
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this member from the organization?')) return;
    setRemoving(memberId);
    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? 'Failed to remove');
      else onUpdate();
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (members.length === 0) {
    return <p className="text-muted-foreground py-4">No members yet.</p>;
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
              <span className="font-medium">{m.name ?? m.user_id}</span>
            </TableCell>
            <TableCell>
              <Select
                value={m.role}
                onValueChange={(v) => handleRoleChange(m.id, v)}
                disabled={updating === m.id}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Badge variant={m.status === 'suspended' ? 'secondary' : 'default'}>
                {m.status ?? 'active'}
              </Badge>
              {m.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  disabled={updating === m.id}
                  onClick={() =>
                    handleStatusChange(m.id, m.status === 'suspended' ? 'active' : 'suspended')
                  }
                >
                  {m.status === 'suspended' ? 'Reactivate' : 'Deactivate'}
                </Button>
              )}
            </TableCell>
            <TableCell className="text-right">
              {m.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={removing === m.id}
                  onClick={() => handleRemove(m.id)}
                >
                  {removing === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4" />
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
