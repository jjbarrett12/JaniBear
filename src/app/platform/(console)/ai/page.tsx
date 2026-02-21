import { PageHeader } from '@/components/enterprise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformAIPage() {
  return (
    <>
      <PageHeader
        title="AI Control Center"
        description="Global defaults, per-org overrides, usage."
      />
      <div className="mt-6 space-y-6">
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Global defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Model, enabled modules toggles, rate limits — wire to your config store.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Per-org overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Table of org overrides.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Requests / tokens / cost by org when tracked.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
