import { PageHeader } from '@/components/enterprise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformProGearPage() {
  return (
    <>
      <PageHeader title="Pro Gear Shop" description="Import CSV, export, product list." />
      <div className="mt-6 space-y-6">
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Import CSV</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Wizard: file upload → mapping → validation → preview → commit.
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Product list</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Status, SKU, vendor, price, last updated, image check.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
