import { requireOrg } from '@/lib/auth';
import { PageLayout } from '@/components/enterprise';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';

export default async function AuditLogPage() {
  const org = await requireOrg();

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Audit log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable record of key actions. Admin-only. No update or delete.
          </p>
        </div>
        <AuditLogViewer orgId={org.org_id} />
      </div>
    </PageLayout>
  );
}
