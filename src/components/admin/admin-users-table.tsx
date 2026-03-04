'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminStatusChip, type MemberStatus } from '@/components/admin/admin-status-chip';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { ADMIN_MICROCOPY } from '@/lib/admin-microcopy';
import { ASSIGNABLE_ROLES } from '@/lib/team-roles';
import {
  Loader2,
  MoreHorizontal,
  UserX,
  UserMinus,
  Search,
  Users,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  sales_rep: 'Sales rep',
  sales: 'Sales',
  ops: 'Operations',
  inspector: 'Inspector',
  cleaner: 'Cleaner',
  client_viewer: 'Client viewer',
  client: 'Client',
};

export type AdminMemberRow = {
  id: string;
  user_id: string;
  role: string;
  status: MemberStatus;
  created_at: string | null;
  profiles: { full_name?: string } | null;
};

export function AdminUsersTable({
  members,
  currentUserId,
  updateMemberRole,
  removeMember,
}: {
  members: AdminMemberRow[];
  currentUserId: string;
  updateMemberRole: (membershipId: string, newRole: string) => Promise<{ error?: string }>;
  removeMember?: (membershipId: string) => Promise<{ error?: string } | void>;
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    type: 'role' | 'deactivate' | 'remove';
    membershipId: string;
    payload?: string;
  } | null>(null);

  const filtered = useMemo(() => {
    let list = members;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.profiles?.full_name ?? '').toLowerCase().includes(q) ||
          m.user_id.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') list = list.filter((m) => m.role === roleFilter);
    if (statusFilter !== 'all') list = list.filter((m) => m.status === statusFilter);
    return list;
  }, [members, search, roleFilter, statusFilter]);

  async function handleRoleChange(membershipId: string, newRole: string) {
    setUpdating(membershipId);
    try {
      const result = await updateMemberRole(membershipId, newRole);
      if (result.error) throw new Error(result.error);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  }

  async function handleDeactivate(membershipId: string) {
    setActionLoading(`deactivate-${membershipId}`);
    try {
      const res = await fetch('/api/admin/users/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(membershipId: string) {
    if (!removeMember) return;
    setActionLoading(`remove-${membershipId}`);
    try {
      const result = await removeMember(membershipId);
      if (result?.error) throw new Error(result.error);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActionLoading(null);
    }
  }

  const name = (m: AdminMemberRow) => m.profiles?.full_name ?? m.user_id.slice(0, 8) + '…';

  if (members.length === 0) {
    return (
      <AdminEmptyState
        icon={<Users className="h-7 w-7" />}
        title={ADMIN_MICROCOPY.empty.users.title}
        description={ADMIN_MICROCOPY.empty.users.description}
        actionLabel={ADMIN_MICROCOPY.empty.users.action}
        onAction={() => (window.location.href = '/app/admin/invites')}
      />
    );
  }

  return (
    <>
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 h-9"
          />
        </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px] h-9 bg-white/5 border-white/10">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {['owner', ...ASSIGNABLE_ROLES].map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9 bg-white/5 border-white/10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="suspended">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">Name</TableHead>
            <TableHead className="text-muted-foreground font-medium">Email</TableHead>
            <TableHead className="text-muted-foreground font-medium">Role</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Last active</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((m) => (
            <TableRow key={m.id} className="border-white/10 hover:bg-white/5">
              <TableCell className="font-medium">{name(m)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">—</TableCell>
              <TableCell>
                {m.role === 'owner' ? (
                  <span className="text-sm text-muted-foreground">{ROLE_LABELS.owner ?? m.role}</span>
                ) : (
                  <Select
                    value={m.role}
                    disabled={updating === m.id}
                    onValueChange={(value) =>
                      setConfirmState({ type: 'role', membershipId: m.id, payload: value })
                    }
                  >
                    <SelectTrigger
                      className="w-[160px] h-9 bg-white/5 border-white/10"
                      title={ADMIN_MICROCOPY.roleChange.tooltip}
                    >
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
                <AdminStatusChip status={m.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">—</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-white/10 bg-card">
                    {m.status === 'active' && m.user_id !== currentUserId && (
                      <DropdownMenuItem
                        onClick={() => setConfirmState({ type: 'deactivate', membershipId: m.id })}
                        className="flex items-center gap-2 text-amber-600"
                      >
                        <UserX className="h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                    {m.user_id !== currentUserId && removeMember && (
                      <DropdownMenuItem
                        onClick={() => setConfirmState({ type: 'remove', membershipId: m.id })}
                        className="flex items-center gap-2 text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Role change confirmation */}
      {confirmState?.type === 'role' && confirmState.payload && (
        <AdminConfirmDialog
          open={!!confirmState}
          onOpenChange={(o) => !o && setConfirmState(null)}
          title={ADMIN_MICROCOPY.roleChange.confirmTitle}
          description={ADMIN_MICROCOPY.roleChange.confirmDescription}
          confirmLabel={ADMIN_MICROCOPY.roleChange.confirmButton}
          cancelLabel={ADMIN_MICROCOPY.roleChange.cancelButton}
          loading={updating === confirmState.membershipId}
          onConfirm={() => handleRoleChange(confirmState.membershipId, confirmState.payload!)}
        />
      )}

      {confirmState?.type === 'deactivate' && (
        <AdminConfirmDialog
          open={!!confirmState}
          onOpenChange={(o) => !o && setConfirmState(null)}
          title={ADMIN_MICROCOPY.deactivateUser.confirmTitle}
          description={ADMIN_MICROCOPY.deactivateUser.confirmDescription}
          confirmLabel={ADMIN_MICROCOPY.deactivateUser.confirmButton}
          cancelLabel={ADMIN_MICROCOPY.deactivateUser.cancelButton}
          variant="destructive"
          loading={!!actionLoading}
          onConfirm={() => handleDeactivate(confirmState.membershipId)}
        />
      )}

      {confirmState?.type === 'remove' && (
        <AdminConfirmDialog
          open={!!confirmState}
          onOpenChange={(o) => !o && setConfirmState(null)}
          title={ADMIN_MICROCOPY.removeUser.confirmTitle}
          description={ADMIN_MICROCOPY.removeUser.confirmDescription}
          confirmLabel={ADMIN_MICROCOPY.removeUser.confirmButton}
          cancelLabel={ADMIN_MICROCOPY.removeUser.cancelButton}
          variant="destructive"
          loading={!!actionLoading}
          onConfirm={() => handleRemove(confirmState.membershipId)}
        />
      )}
    </>
  );
}
