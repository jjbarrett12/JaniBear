'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Sparkles, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit_price: z.string().min(1, 'Unit price is required'),
  service_date_start: z.string().optional(),
  service_date_end: z.string().optional(),
  category: z.string().optional(),
});

const invoiceSchema = z.object({
  location_id: z.string().optional(),
  invoice_date: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded']),
  currency: z.string().default('USD'),
  tax_amount: z.string().optional(),
  discount_amount: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: any;
  locations: Array<{ id: string; name: string }>;
}

export function InvoiceForm({ invoice, locations }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice
      ? {
          location_id: invoice.location_id || '',
          invoice_date: invoice.invoice_date || '',
          due_date: invoice.due_date || '',
          status: invoice.status || 'draft',
          currency: invoice.currency || 'USD',
          tax_amount: invoice.tax_amount?.toString() || '0',
          discount_amount: invoice.discount_amount?.toString() || '0',
          notes: invoice.notes || '',
          terms: invoice.terms || '',
          items: invoice.items || [{ description: '', quantity: '1', unit_price: '0' }],
        }
      : {
          status: 'draft',
          currency: 'USD',
          tax_amount: '0',
          discount_amount: '0',
          items: [{ description: '', quantity: '1', unit_price: '0' }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || '0');
    const price = parseFloat(item.unit_price || '0');
    return sum + qty * price;
  }, 0);

  const taxAmount = parseFloat(watch('tax_amount') || '0');
  const discountAmount = parseFloat(watch('discount_amount') || '0');
  const totalAmount = subtotal + taxAmount - discountAmount;

  const generateAINotes = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/invoice-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.filter((item) => item.description),
          total: totalAmount,
        }),
      });

      if (!response.ok) throw new Error('AI service unavailable');

      const { notes } = await response.json();

      if (notes) {
        setValue('notes', notes);
        toast({
          title: 'AI Notes Generated',
          description: 'Professional invoice notes have been added.',
        });
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Service Unavailable',
        description: 'AI notes are not available.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!orgMember) throw new Error('Organization not found');

      const invoiceData = {
        org_id: orgMember.org_id,
        invoice_number: invoice?.invoice_number || undefined,
        location_id: data.location_id || null,
        invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
        due_date: data.due_date,
        status: data.status,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency: data.currency,
        notes: data.notes || null,
        terms: data.terms || null,
        created_by: user.id,
      };

      let invoiceId: string;

      if (invoice) {
        const { data: updated, error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoice.id)
          .select()
          .single();

        if (error) throw error;
        invoiceId = updated.id;

        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);
      } else {
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('org_id', orgMember.org_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let invoiceNumber = 'INV-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '-0001';
        if (lastInvoice?.invoice_number) {
          const match = lastInvoice.invoice_number.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1]) + 1;
            invoiceNumber = lastInvoice.invoice_number.replace(/-\d+$/, `-${num.toString().padStart(4, '0')}`);
          }
        }

        const { data: created, error } = await supabase
          .from('invoices')
          .insert({ ...invoiceData, invoice_number: invoiceNumber })
          .select()
          .single();

        if (error) throw error;
        invoiceId = created.id;
      }

      const itemsToInsert = data.items.map((item) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: parseFloat(item.quantity || '0'),
        unit_price: parseFloat(item.unit_price || '0'),
        total_price: parseFloat(item.quantity || '0') * parseFloat(item.unit_price || '0'),
        service_date_start: item.service_date_start || null,
        service_date_end: item.service_date_end || null,
        category: item.category || null,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: invoice ? 'Invoice updated' : 'Invoice created',
        description: 'Invoice has been saved successfully.',
      });

      router.push('/app/admin/invoices');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Information</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAINotes}
                  disabled={isGeneratingAI}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingAI ? 'Generating...' : 'AI Notes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location_id">Location (Optional)</Label>
                  <Select
                    value={watch('location_id')}
                    onValueChange={(value) => setValue('location_id', value)}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    {...register('invoice_date')}
                    className="h-14"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    {...register('due_date')}
                    className="h-14"
                  />
                  {errors.due_date && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.due_date.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Item {index + 1}</Label>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label>
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      className="h-14"
                      placeholder="Service description"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`)}
                        className="h-14"
                      />
                    </div>
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unit_price`)}
                        className="h-14"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="w-full p-3 bg-gray-50 rounded text-sm font-semibold">
                        Total: {formatCurrency(
                          parseFloat(watch(`items.${index}.quantity`) || '0') *
                          parseFloat(watch(`items.${index}.unit_price`) || '0')
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Service Start Date</Label>
                      <Input
                        type="date"
                        {...register(`items.${index}.service_date_start`)}
                        className="h-14"
                      />
                    </div>
                    <div>
                      <Label>Service End Date</Label>
                      <Input
                        type="date"
                        {...register(`items.${index}.service_date_end`)}
                        className="h-14"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ description: '', quantity: '1', unit_price: '0' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  {...register('terms')}
                  placeholder="Payment terms, conditions..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div>
                  <Label htmlFor="tax_amount">Tax Amount</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    {...register('tax_amount')}
                    className="h-14"
                  />
                </div>
                <div>
                  <Label htmlFor="discount_amount">Discount Amount</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    {...register('discount_amount')}
                    className="h-14"
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t text-lg font-bold">
                  <span>Total:</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          size="lg"
          className="h-14 text-lg flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : invoice
            ? 'Update Invoice'
            : 'Create Invoice'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 text-lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
