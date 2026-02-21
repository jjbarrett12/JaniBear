import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';

export default function PlatformProGearPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pro Gear Shop</h1>
        <p className="text-muted-foreground mt-1">Import/export products (platform admin)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Product catalog
          </CardTitle>
          <CardDescription>Import/export and manage Pro Gear products (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Use API or future UI for bulk import/export.</p>
        </CardContent>
      </Card>
    </div>
  );
}
