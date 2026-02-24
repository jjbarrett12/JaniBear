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
import { createOrgInvite } from '@/actions/team';
import { ASSIGNABLE_ROLES } from '@/actions/team';
import { Loader2, Copy, Check } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager / Supervisor',
  sales_rep: 'Sales rep',
  sales: 'Sales',
  ops: 'Operations',
  inspector: 'Inspector',
  cleaner: 'Cleaner',
  client_viewer: 'Client viewer',
};

export function InviteUserForm({ seatAllowed }: { seatAllowed: boolean }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('ops');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteLink(null);
    if (!email.trim()) {
      setError('Enter an email address.');
      return;
    }
    if (!seatAllowed) {
      setError('Seat limit reached. Upgrade your plan to add more members.');
      return;
    }
    setLoading(true);
    try {
      const result = await createOrgInvite(email.trim(), role);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        setEmail('');
      }
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || !seatAllowed}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="invite-role">Role</Label>
          <Select value={role} onValueChange={setRole} disabled={loading}>
            <SelectTrigger id="invite-role" className="mt-1">
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
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={loading || !seatAllowed}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating…
          </>
        ) : (
          'Create invite link'
        )}
      </Button>
      {inviteLink && (
        <div className="rounded-md border bg-muted/50 p-3 space-y-2">
          <p className="text-sm font-medium">Invite link created. Share this link with the user; they can sign in or sign up to join your organization.</p>
          <div className="flex gap-2">
            <Input readOnly value={inviteLink} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
