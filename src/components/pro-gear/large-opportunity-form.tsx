'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitLargeOpportunityAction } from '@/app/app/pro-gear/actions';

export function LargeOpportunityForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    contact_name: '',
    email: '',
    company_name: '',
    phone: '',
    estimated_quantity: '',
    estimated_value: '',
    message: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.email.trim()) return;
    setPending(true);
    try {
      const valueCents = form.estimated_value
        ? Math.round(parseFloat(form.estimated_value) * 100)
        : undefined;
      const ok = await submitLargeOpportunityAction({
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        company_name: form.company_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        estimated_quantity: form.estimated_quantity.trim() || undefined,
        estimated_value_cents: valueCents && !isNaN(valueCents) ? valueCents : undefined,
        message: form.message.trim() || undefined,
      });
      if (ok) setSent(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">
        Thanks. We&apos;ll contact you about your large order opportunity.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="contact_name">Contact name *</Label>
        <Input
          id="contact_name"
          required
          value={form.contact_name}
          onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_name">Company</Label>
        <Input
          id="company_name"
          value={form.company_name}
          onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="estimated_quantity">Estimated quantity (e.g. units, cases)</Label>
        <Input
          id="estimated_quantity"
          value={form.estimated_quantity}
          onChange={(e) => setForm((f) => ({ ...f, estimated_quantity: e.target.value }))}
          placeholder="e.g. 500 cases"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="estimated_value">Estimated order value ($)</Label>
        <Input
          id="estimated_value"
          type="number"
          min={0}
          step={1}
          value={form.estimated_value}
          onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))}
          placeholder="e.g. 10000"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Tell us about your needs..."
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          Request to be contacted
        </Button>
      </div>
    </form>
  );
}
