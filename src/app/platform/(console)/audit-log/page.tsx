import { PageHeader } from '@/components/enterprise';
import { Card, CardContent } from '@/components/ui/card';

export default function PlatformAuditLogPage() {
  return (
    <>
      <PageHeader title="Audit Log" description="Platform-level audit trail." />
      <Card className="rounded-2xl border border-border bg-card shadow-sm mt-6">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Audit log table — wire to audit events.
        </CardContent>
      </Card>
    </>
  );
}
