import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProGearImportForm } from '@/components/pro-gear/admin-import-form';

export default function ProGearAdminImportPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Import products (CSV)</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upsert by slug. Columns: slug, name, category (gloves|equipment),
            brand, description, retail_price_cents, member_price_cents,
            savings_percent, shipping_estimate_days, featured (true|false),
            active (true|false), private_label_available, private_label_moq_units,
            private_label_notes. Dry run validates only.
          </p>
        </CardHeader>
        <CardContent>
          <ProGearImportForm />
        </CardContent>
      </Card>
    </div>
  );
}
