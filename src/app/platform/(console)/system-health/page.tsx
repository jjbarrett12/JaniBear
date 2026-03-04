import { PageHeader } from '@/components/enterprise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformSystemHealthPage() {
  return (
    <>
      <PageHeader title="System Health" description="Errors, job failures, latency, queues." />
      <Card className="rounded-2xl border border-border bg-card shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Health</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Errors table, job failures, latency, queues — wire to observability stack.
        </CardContent>
      </Card>
    </>
  );
}
