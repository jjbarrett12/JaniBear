'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock } from 'lucide-react';

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

const SENSITIVE_KEYS = ['org.manage_users', 'org.manage_settings', 'billing.manage'];

function permissionLabel(key: string): string {
  return key.replace(/\./g, ' · ');
}

export function AdminRolesContent({
  rolePermissions,
}: {
  rolePermissions: Record<string, string[]>;
}) {
  const roles = Object.keys(rolePermissions).sort();
  if (roles.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No role permissions configured. Contact your administrator.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <p className="text-sm text-muted-foreground">
        Each role has a set of permissions. Users get the permissions of their assigned role. This page is read-only.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card
            key={role}
            className="border-white/10 bg-white/5 backdrop-blur-md"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {ROLE_LABELS[role] ?? role}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(rolePermissions[role] ?? []).map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-sm"
                >
                  {SENSITIVE_KEYS.includes(key) && (
                    <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span
                    className={
                      SENSITIVE_KEYS.includes(key)
                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {permissionLabel(key)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">Effective access</h4>
        <p className="text-sm text-muted-foreground">
          When you assign a role to a user, they immediately get all permissions listed for that role. Changing their role updates their access. Sensitive permissions (user management, settings, billing) are marked with a lock icon.
        </p>
      </div>
    </div>
  );
}
