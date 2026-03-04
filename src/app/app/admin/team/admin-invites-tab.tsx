'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ASSIGNABLE_ROLES } from '@/lib/team-roles';
import { Loader2, Mail, Copy, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Invite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
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

export function AdminInvitesTab({
  orgId,
  invites,
  loading,
  onInviteSent,
  onRevoke,
}: {
  orgId: string;
  invites: Invite[];
  loading: boolean;
  onInviteSent: () => void;
  onRevoke: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('manager');
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSending(true);
    setInviteLink(null);
    try {
      const res = await fetch(`/api/orgs/${orgId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Failed to create invite');
        return;
      }
      setInviteLink(data.invite_link ?? null);
      setEmail('');
      onInviteSent();
    } finally {
      setSending(false);
    }
  }

  async function handleResend(inviteId: string) {
    const res = await fetch(`/api/orgs/${orgId}/invites/${inviteId}/resend`, {
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data.error ?? 'Failed to resend');
    else {
      if (data.invite_link) {
        await navigator.clipboard.writeText(data.invite_link);
        alert('Invite link copied to clipboard.');
      }
      onRevoke();
    }
  }

  async function handleRevoke(inviteId: string) {
    if (!confirm('Revoke this invite?')) return;
    setRevoking(inviteId);
    try {
      const res = await fetch(`/api/orgs/${orgId}/invites/${inviteId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? 'Failed to revoke');
      else onRevoke();
    } finally {
      setRevoking(null);
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    alert('Copied to clipboard.');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
            className="w-64"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="invite-role" className="w-[180px]">
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
        </div>
        <Button type="submit" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          <span className="ml-2">Send invite</span>
        </Button>
      </form>
      {inviteLink && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <p className="font-medium mb-1">Invite link (copy and share):</p>
          <div className="flex gap-2">
            <Input readOnly value={inviteLink} className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={() => copyLink(inviteLink)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div>
        <h3 className="font-medium mb-2">Pending invites</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : invites.length === 0 ? (
          <p className="text-muted-foreground">No pending invites.</p>
        ) : (
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div>
                  <span className="font-medium">{inv.email}</span>
                  <span className="text-muted-foreground ml-2">
                    {ROLE_LABELS[inv.role] ?? inv.role}
                  </span>
                  <span className="text-muted-foreground text-sm ml-2">
                    · expires {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResend(inv.id)}
                    title="Resend (extends expiry and copy link)"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={revoking === inv.id}
                    onClick={() => handleRevoke(inv.id)}
                  >
                    {revoking === inv.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
