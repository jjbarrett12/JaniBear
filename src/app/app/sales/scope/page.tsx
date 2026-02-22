import { requireOrg } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ScopeBuilderPage() {
  await requireOrg();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scope Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Define service scope and requirements for proposals.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Scope Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Scope builder content coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
