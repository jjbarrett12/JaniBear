'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateProGearProductAction } from '@/app/app/pro-gear/admin-actions';
import type { ProGearProduct } from '@/types/pro-gear';

export function ProGearProductEditForm({ product }: { product: ProGearProduct }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    brand: product.brand ?? '',
    description: product.description ?? '',
    retail_price_cents: product.retail_price_cents ?? '',
    member_price_cents: product.member_price_cents,
    savings_percent: product.savings_percent ?? '',
    shipping_estimate_days: product.shipping_estimate_days ?? '',
    active: product.active,
    featured: product.featured,
    private_label_available: product.private_label_available,
    private_label_moq_units: product.private_label_moq_units ?? '',
    private_label_notes: product.private_label_notes ?? '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const ok = await updateProGearProductAction(product.id, {
        name: form.name,
        slug: form.slug || undefined,
        brand: form.brand || null,
        description: form.description || null,
        retail_price_cents:
          form.retail_price_cents === ''
            ? null
            : parseInt(String(form.retail_price_cents), 10),
        member_price_cents: parseInt(String(form.member_price_cents), 10),
        savings_percent:
          form.savings_percent === ''
            ? null
            : parseInt(String(form.savings_percent), 10),
        shipping_estimate_days:
          form.shipping_estimate_days === ''
            ? null
            : parseInt(String(form.shipping_estimate_days), 10),
        active: form.active,
        featured: form.featured,
        private_label_available: form.private_label_available,
        private_label_moq_units:
          form.private_label_moq_units === ''
            ? null
            : parseInt(String(form.private_label_moq_units), 10),
        private_label_notes: form.private_label_notes || null,
      });
      if (ok) router.push('/app/pro-gear/admin');
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit product</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="retail_price_cents">Retail (cents)</Label>
              <Input
                id="retail_price_cents"
                type="number"
                min={0}
                value={form.retail_price_cents}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    retail_price_cents: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="member_price_cents">Member price (cents)</Label>
              <Input
                id="member_price_cents"
                type="number"
                min={0}
                value={form.member_price_cents}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    member_price_cents: Number(e.target.value),
                  }))
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="savings_percent">Savings %</Label>
              <Input
                id="savings_percent"
                type="number"
                min={0}
                max={100}
                value={form.savings_percent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, savings_percent: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipping_estimate_days">Shipping (days)</Label>
              <Input
                id="shipping_estimate_days"
                type="number"
                min={0}
                value={form.shipping_estimate_days}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    shipping_estimate_days: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((f) => ({ ...f, featured: e.target.checked }))
                }
              />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.private_label_available}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    private_label_available: e.target.checked,
                  }))
                }
              />
              Private label available
            </label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="private_label_moq_units">Private label MOQ</Label>
            <Input
              id="private_label_moq_units"
              type="number"
              min={0}
              value={form.private_label_moq_units}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  private_label_moq_units: e.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="private_label_notes">Private label notes</Label>
            <Input
              id="private_label_notes"
              value={form.private_label_notes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  private_label_notes: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              Save
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/app/pro-gear/admin">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
