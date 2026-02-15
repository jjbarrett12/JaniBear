import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrivateLabelInquiryForm } from '@/components/pro-gear/private-label-inquiry-form';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function PrivateLabelInquiryPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('pro_gear_products')
    .select('*')
    .eq('id', productId)
    .eq('active', true)
    .eq('private_label_available', true)
    .single();

  if (!product) notFound();

  return (
    <>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/app/pro-gear" className="hover:text-foreground">
          Pro Gear
        </Link>
        {' / '}
        <Link
          href={`/app/pro-gear/product/${(product as ProGearProduct).slug}`}
          className="hover:text-foreground"
        >
          {(product as ProGearProduct).name}
        </Link>
        {' / Private label'}
      </nav>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Discuss Private Label</CardTitle>
          <p className="text-sm text-muted-foreground">
            {(product as ProGearProduct).name} — we&apos;ll contact you to discuss
            options.
          </p>
        </CardHeader>
        <CardContent>
          <PrivateLabelInquiryForm product={product as ProGearProduct} />
        </CardContent>
      </Card>
    </>
  );
}
