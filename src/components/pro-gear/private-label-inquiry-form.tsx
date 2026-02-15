'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPrivateLabelInquiryAction } from '@/app/app/pro-gear/actions';
import type { ProGearProduct } from '@/types/pro-gear';

export function PrivateLabelInquiryForm({ product }: { product: ProGearProduct }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    estimated_quantity: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.email.trim()) return;
    setPending(true);
    try {
      const ok = await createPrivateLabelInquiryAction(product.id, {
        company_name: form.company_name.trim() || undefined,
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        estimated_quantity: form.estimated_quantity
          ? parseInt(form.estimated_quantity, 10)
          : undefined,
        notes: form.notes.trim() || undefined,
      });
      if (ok) setSent(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Inquiry sent. We&apos;ll reach out about private labeling for{' '}
          {product.name}.
        </p>
        <Button onClick={() => router.push(`/app/pro-gear/product/${product.slug}`)}>
          Back to product
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input
          id="company_name"
          value={form.company_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, company_name: e.target.value }))
          }
          placeholder="Optional"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact_name">Contact name *</Label>
        <Input
          id="contact_name"
          required
          value={form.contact_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, contact_name: e.target.value }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) =>
            setForm((f) => ({ ...f, phone: e.target.value }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="estimated_quantity">Estimated quantity</Label>
        <Input
          id="estimated_quantity"
          type="number"
          min={1}
          value={form.estimated_quantity}
          onChange={(e) =>
            setForm((f) => ({ ...f, estimated_quantity: e.target.value }))
          }
          placeholder="Optional"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Submit inquiry
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/app/pro-gear/product/${product.slug}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
