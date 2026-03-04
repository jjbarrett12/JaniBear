'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog';
import { ADMIN_MICROCOPY } from '@/lib/admin-microcopy';
import { ASSIGNABLE_ROLES } from '@/lib/team-roles';
import { createOrgInvite, revokeInvite } from '@/actions/team';
import { Mail, Loader2, Send, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales_rep: 'Sales rep',
  sales: 'Sales',
  ops: 'Operations',
  inspector: 'Inspector',
  cleaner: 'Cleaner',
  client_viewer: 'Client viewer',
};

export type InviteRow = {
  id: string;
  email: string;
  role: string;
  created_at: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  status: 'pending' | 'expired' | 'accepted';
};

export function AdminInvitesClient({ initialInvites }: { initialInvites: InviteRow[] }) {
  const [invites, setInvites] = useState<InviteRow[]>(initialInvites);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ASSIGNABLE_ROLES[0] ?? 'sales');
  const [bulkEmails, setBulkEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const result = await createOrgInvite(email.trim(), role);
      if (result.error) throw new Error(result.error);
      setEmail('');
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkInvite(e: React.FormEvent) {
    e.preventDefault();
    const emails = bulkEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return;
    setLoading(true);
    try {
      for (const em of emails) {
        const result = await createOrgInvite(em, role);
        if (result.error) throw new Error(result.error);
      }
      setBulkEmails('');
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create invites');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(inviteId: string) {
    setRevokeId(inviteId);
    try {
      const result = await revokeInvite(inviteId);
      if (result?.error) throw new Error(result.error);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      setConfirmRevoke(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke');
    } finally {
      setRevokeId(null);
    }
  }

  const pending = invites.filter((i) => i.status === 'pending' || i.status === 'expired');

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <form onSubmit={handleInvite} className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Invite by email</h3>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading || !email.trim()} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send invite
          </Button>
        </form>

        <form onSubmit={handleBulkInvite} className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Bulk invite</h3>
          <div className="space-y-2">
            <Label htmlFor="bulk-emails">Emails (one per line or comma-separated)</Label>
            <Textarea
              id="bulk-emails"
              placeholder="a@co.com&#10;b@co.com"
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              className="min-h-[100px] bg-white/5 border-white/10 resize-none"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Role for all</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading || !bulkEmails.trim()} size="sm" variant="secondary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Invite all
          </Button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Pending invites</h3>
        {invites.length === 0 ? (
          <AdminEmptyState
            icon={<Mail className="h-7 w-7" />}
            title={ADMIN_MICROCOPY.empty.invites.title}
            description={ADMIN_MICROCOPY.empty.invites.description}
            actionLabel={ADMIN_MICROCOPY.empty.invites.action}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                <TableHead className="text-muted-foreground font-medium">Created</TableHead>
                <TableHead className="text-muted-foreground font-medium">Expires</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((i) => (
                <TableRow key={i.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium">{i.email}</TableCell>
                  <TableCell>{ROLE_LABELS[i.role] ?? i.role}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {i.expires_at ? new Date(i.expires_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        i.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30'
                          : i.status === 'expired'
                            ? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-400/30'
                      }
                    >
                      {i.status === 'accepted' ? 'Accepted' : i.status === 'expired' ? 'Expired' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {i.status !== 'accepted' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={revokeId === i.id}
                        onClick={() => setConfirmRevoke(i.id)}
                      >
                        {revokeId === i.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {confirmRevoke && (
        <AdminConfirmDialog
          open={!!confirmRevoke}
          onOpenChange={(o) => !o && setConfirmRevoke(null)}
          title={ADMIN_MICROCOPY.revokeInvite.confirmTitle}
          description={ADMIN_MICROCOPY.revokeInvite.confirmDescription}
          confirmLabel={ADMIN_MICROCOPY.revokeInvite.confirmButton}
          cancelLabel={ADMIN_MICROCOPY.revokeInvite.cancelButton}
          variant="destructive"
          loading={revokeId !== null}
          onConfirm={() => handleRevoke(confirmRevoke)}
        />
      )}
    </div>
  );
}
