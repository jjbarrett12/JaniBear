import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProGearCheckoutPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Request invoice / Submit order</CardTitle>
          <CardDescription>
            Complete your order from the cart. You can pay in full, finance over 6 or 12 months, or submit for invoice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/app/pro-gear/cart">Go to cart</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
