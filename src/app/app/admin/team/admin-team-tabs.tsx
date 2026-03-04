'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail, Shield, FileText } from 'lucide-react';
import { AdminUsersTab } from './admin-users-tab';
import { AdminInvitesTab } from './admin-invites-tab';
import { AdminRolesTab } from './admin-roles-tab';
import { AdminAuditTab } from './admin-audit-tab';

type Member = {
  id: string;
  user_id: string;
  role: string;
  status: string | null;
  created_at: string;
  name: string | null;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
};

export function AdminTeamTabs({
  orgId,
  rolesAndPermissions,
}: {
  orgId: string;
  rolesAndPermissions: Record<string, string[]>;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);

  const fetchMembers = () => {
    setLoadingMembers(true);
    fetch(`/api/orgs/${orgId}/members`)
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members ?? []);
      })
      .finally(() => setLoadingMembers(false));
  };

  const fetchInvites = () => {
    setLoadingInvites(true);
    fetch(`/api/orgs/${orgId}/invites`)
      .then((r) => r.json())
      .then((d) => {
        setInvites(d.invites ?? []);
      })
      .finally(() => setLoadingInvites(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [orgId]);
  useEffect(() => {
    fetchInvites();
  }, [orgId]);

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
        <TabsTrigger value="users" className="gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="invites" className="gap-2">
          <Mail className="h-4 w-4" />
          Invites
        </TabsTrigger>
        <TabsTrigger value="roles" className="gap-2">
          <Shield className="h-4 w-4" />
          Roles & permissions
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-2">
          <FileText className="h-4 w-4" />
          Audit log
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Assign roles, deactivate, or remove members. Only owners can assign the owner role.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminUsersTab
              orgId={orgId}
              members={members}
              loading={loadingMembers}
              onUpdate={fetchMembers}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="invites" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Invites</CardTitle>
            <CardDescription>Invite by email and role. Resend or revoke pending invites.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminInvitesTab
              orgId={orgId}
              invites={invites}
              loading={loadingInvites}
              onInviteSent={fetchInvites}
              onRevoke={fetchInvites}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="roles" className="mt-6">
        <AdminRolesTab rolesAndPermissions={rolesAndPermissions} />
      </TabsContent>
      <TabsContent value="audit" className="mt-6">
        <AdminAuditTab orgId={orgId} />
      </TabsContent>
    </Tabs>
  );
}
