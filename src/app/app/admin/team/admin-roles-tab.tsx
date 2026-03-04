'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SENSITIVE_PERMISSIONS = ['org.manage_users', 'org.manage_settings', 'billing.manage'];

export function AdminRolesTab({
  rolesAndPermissions,
}: {
  rolesAndPermissions: Record<string, string[]>;
}) {
  const roles = Object.keys(rolesAndPermissions).sort();
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    sales_rep: 'Sales rep',
    sales: 'Sales',
    ops: 'Operations',
    inspector: 'Inspector',
    cleaner: 'Crew',
    client: 'Client',
    client_viewer: 'Client viewer',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles and permissions</CardTitle>
        <CardDescription>
          Read-only view of which permissions each role has. Sensitive permissions are highlighted.
          Changes require a database migration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role} className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">
                {roleLabels[role] ?? role}
                {role === 'owner' && (
                  <Badge variant="secondary" className="ml-2">Full access</Badge>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(rolesAndPermissions[role] ?? []).map((perm) => (
                  <Badge
                    key={perm}
                    variant={SENSITIVE_PERMISSIONS.includes(perm) ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Only an owner can assign the owner role. Admins cannot grant permissions beyond their own.
        </p>
      </CardContent>
    </Card>
  );
}
