'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Mail, Trash2, Copy } from 'lucide-react';
import {
  listAccountUsers,
  addUserToAccount,
  removeUserFromAccount,
  listOrgMembersNotOnAccount,
  inviteAccountUserByEmail,
  type AccountUserRow,
} from '@/actions/account-users';
import type { Database } from '@/lib/types/database';

type Account = Database['public']['Tables']['accounts']['Row'];

export function AccountTeamTab({ account }: { account: Account }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<AccountUserRow[]>([]);
  const [limit, setLimit] = useState(account.user_limit ?? 5);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  async function load() {
    setLoading(true);
    const result = await listAccountUsers(account.id);
    setLoading(false);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      return;
    }
    setUsers(result.users);
    setLimit(result.limit);
    setCurrent(result.current);
  }

  async function loadOrgMembers() {
    const result = await listOrgMembersNotOnAccount(account.id);
    if (typeof result === 'object' && 'error' in result) {
      setOrgMembers([]);
      return;
    }
    setOrgMembers(Array.isArray(result) ? result : []);
  }

  useEffect(() => {
    load();
  }, [account.id]);

  async function handleAddExisting() {
    if (!selectedUserId) return;
    setAddLoading(true);
    const { error } = await addUserToAccount(account.id, selectedUserId, 'admin');
    setAddLoading(false);
    if (error) {
      toast({ title: 'Could not add user', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'User added' });
    setSelectedUserId('');
    load();
    loadOrgMembers();
  }

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) {
      toast({ title: 'Enter an email', variant: 'destructive' });
      return;
    }
    setInviteLoading(true);
    const result = await inviteAccountUserByEmail(account.id, email, 'admin');
    setInviteLoading(false);
    if (result.error) {
      toast({ title: 'Invite failed', description: result.error, variant: 'destructive' });
      return;
    }
    setInviteLink(result.inviteLink ?? null);
    setInviteEmail('');
    if (result.inviteLink) {
      toast({ title: 'Invite created', description: 'Copy the link and send it to the user.' });
    }
    load();
  }

  async function handleRemove(userId: string) {
    const { error } = await removeUserFromAccount(account.id, userId);
    if (error) {
      toast({ title: 'Could not remove user', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'User removed' });
    load();
    loadOrgMembers();
  }

  function copyInviteLink() {
    if (!inviteLink) return;
    const url = typeof window !== 'undefined' ? `${window.location.origin}${inviteLink}` : inviteLink;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard' });
  }

  const atLimit = current >= limit;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Account users
            </CardTitle>
            <CardDescription>
              Users who can sign in and manage this account: employees, schedules, and facilities. Limit: {current} / {limit}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <>
              {users.length === 0 ? (
                <p className="text-muted-foreground py-4">No users yet. Add an existing org member or invite by email.</p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">{u.profiles?.full_name ?? u.user_id.slice(0, 8)}</td>
                          <td className="p-3 capitalize">{u.role}</td>
                          <td className="p-3">
                            <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>{u.status}</Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemove(u.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!atLimit && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Add existing org member</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                        onOpenChange={(open) => open && loadOrgMembers()}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {orgMembers.length === 0 ? (
                            <SelectItem value="" disabled>
                              No other org members to add
                            </SelectItem>
                          ) : (
                            orgMembers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.full_name || m.id.slice(0, 8)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddExisting}
                        disabled={!selectedUserId || addLoading}
                      >
                        {addLoading ? 'Adding…' : <UserPlus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Invite by email</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={inviteLoading}
                      />
                      <Button type="button" onClick={handleInvite} disabled={inviteLoading}>
                        {inviteLoading ? 'Sending…' : <Mail className="h-4 w-4" />}
                      </Button>
                    </div>
                    {inviteLink && (
                      <div className="flex gap-2 items-center">
                        <Input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}${inviteLink}` : inviteLink} className="text-xs" />
                        <Button type="button" variant="outline" size="sm" onClick={copyInviteLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {atLimit && (
                <p className="text-amber-600 text-sm">
                  User limit reached ({limit}). Edit the account to increase the limit or remove a user.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
