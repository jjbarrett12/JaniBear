import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/components/pro-gear/product-card';
import { ProGearProductDetailClient } from '@/components/pro-gear/product-detail-client';
import { ProGearROICardClient } from '@/components/pro-gear/roi-card-client';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function ProGearProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from('pro_gear_products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error || !product) notFound();

  const p = product as ProGearProduct;
  const img =
    Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
  const hasLaborSavings =
    p.category === 'equipment' &&
    p.estimated_labor_hours_saved_per_week != null &&
    p.estimated_labor_hours_saved_per_week > 0;
  const hourlyRateCents = p.avg_operator_hourly_rate_cents ?? 2000;

  return (
    <>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {p.savings_percent != null && (
            <Badge className="bg-green-600 hover:bg-green-700">
              Save {p.savings_percent}%
            </Badge>
          )}
          {hasLaborSavings && (
            <Badge variant="secondary">Labor savings</Badge>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          {p.name}
        </h1>
        {p.brand && (
          <p className="mt-1 text-muted-foreground">{p.brand}</p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
          {img ? (
            <img
              src={img}
              alt={p.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {p.description && (
            <p className="text-muted-foreground">{p.description}</p>
          )}

          {p.category === 'gloves' && p.glove_fields && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Specs</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <dl className="grid gap-2 sm:grid-cols-2">
                  {(p.glove_fields as Record<string, unknown>).material && (
                    <>
                      <dt className="text-muted-foreground">Material</dt>
                      <dd>{(p.glove_fields as Record<string, unknown>).material as string}</dd>
                    </>
                  )}
                  {(p.glove_fields as Record<string, unknown>).color && (
                    <>
                      <dt className="text-muted-foreground">Color</dt>
                      <dd>{(p.glove_fields as Record<string, unknown>).color as string}</dd>
                    </>
                  )}
                  {(p.glove_fields as Record<string, unknown>).thickness_mil && (
                    <>
                      <dt className="text-muted-foreground">Thickness</dt>
                      <dd>{(p.glove_fields as Record<string, unknown>).thickness_mil as number} mil</dd>
                    </>
                  )}
                  {(p.glove_fields as Record<string, unknown>).size_range && (
                    <>
                      <dt className="text-muted-foreground">Size</dt>
                      <dd>{(p.glove_fields as Record<string, unknown>).size_range as string}</dd>
                    </>
                  )}
                  {(p.glove_fields as Record<string, unknown>).case_count && (
                    <>
                      <dt className="text-muted-foreground">Case count</dt>
                      <dd>{(p.glove_fields as Record<string, unknown>).case_count as number}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {p.category === 'equipment' && p.equipment_fields && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Specs</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <dl className="grid gap-2 sm:grid-cols-2">
                  {(p.equipment_fields as Record<string, unknown>).type && (
                    <>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd>{(p.equipment_fields as Record<string, unknown>).type as string}</dd>
                    </>
                  )}
                  {(p.equipment_fields as Record<string, unknown>).power && (
                    <>
                      <dt className="text-muted-foreground">Power</dt>
                      <dd>{(p.equipment_fields as Record<string, unknown>).power as string}</dd>
                    </>
                  )}
                  {(p.equipment_fields as Record<string, unknown>).width_in != null && (
                    <>
                      <dt className="text-muted-foreground">Width</dt>
                      <dd>{(p.equipment_fields as Record<string, unknown>).width_in as number}&quot;</dd>
                    </>
                  )}
                  {(p.equipment_fields as Record<string, unknown>).battery && (
                    <>
                      <dt className="text-muted-foreground">Battery</dt>
                      <dd>{(p.equipment_fields as Record<string, unknown>).battery as string}</dd>
                    </>
                  )}
                  {(p.equipment_fields as Record<string, unknown>).warranty_years != null && (
                    <>
                      <dt className="text-muted-foreground">Warranty</dt>
                      <dd>{(p.equipment_fields as Record<string, unknown>).warranty_years as number} yr</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {formatPrice(p.member_price_cents)}
                </span>
                {p.retail_price_cents != null && (
                  <span className="text-muted-foreground line-through">
                    {formatPrice(p.retail_price_cents)}
                  </span>
                )}
              </div>
              {p.shipping_estimate_days != null && (
                <p className="text-sm text-muted-foreground">
                  Est. shipping: {p.shipping_estimate_days} business days
                </p>
              )}
              <ProGearProductDetailClient product={p} />
            </CardContent>
          </Card>

          {hasLaborSavings && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ROI — Labor savings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on {p.estimated_labor_hours_saved_per_week} hrs saved/week at your rate
                </p>
              </CardHeader>
              <CardContent>
                <ProGearROICardClient
                  hoursPerWeek={p.estimated_labor_hours_saved_per_week!}
                  defaultHourlyRateCents={hourlyRateCents}
                  productPriceCents={p.member_price_cents}
                />
              </CardContent>
            </Card>
          )}

          {p.category === 'equipment' && p.private_label_available && (
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Private Label Available</CardTitle>
                  <Badge className="bg-blue-600 hover:bg-blue-700">Optional</Badge>
                </div>
                {p.private_label_moq_units != null && (
                  <p className="text-sm text-muted-foreground">
                    MOQ: {p.private_label_moq_units} units
                  </p>
                )}
                {p.private_label_notes && (
                  <p className="text-sm text-muted-foreground">
                    {p.private_label_notes}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <ProGearProductDetailClient product={p} showPrivateLabel />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

