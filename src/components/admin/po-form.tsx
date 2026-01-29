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

const poItemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().default('each'),
  unit_price: z.string().min(1, 'Unit price is required'),
});

const poSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  supplier_email: z.string().email().optional().or(z.literal('')),
  supplier_phone: z.string().optional(),
  supplier_address: z.string().optional(),
  order_date: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'ordered', 'in_transit', 'delivered', 'cancelled']),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

type POFormData = z.infer<typeof poSchema>;

interface POFormProps {
  purchaseOrder?: any;
}

export function POForm({ purchaseOrder }: POFormProps) {
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
  } = useForm<POFormData>({
    resolver: zodResolver(poSchema),
    defaultValues: purchaseOrder
      ? {
          supplier_name: purchaseOrder.supplier_name || '',
          supplier_email: purchaseOrder.supplier_email || '',
          supplier_phone: purchaseOrder.supplier_phone || '',
          supplier_address: purchaseOrder.supplier_address || '',
          order_date: purchaseOrder.order_date || '',
          expected_delivery_date: purchaseOrder.expected_delivery_date || '',
          status: purchaseOrder.status || 'draft',
          currency: purchaseOrder.currency || 'USD',
          notes: purchaseOrder.notes || '',
          items: purchaseOrder.items || [{ item_name: '', quantity: '1', unit: 'each', unit_price: '0' }],
        }
      : {
          status: 'draft',
          currency: 'USD',
          items: [{ item_name: '', quantity: '1', unit: 'each', unit_price: '0' }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const totalAmount = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || '0');
    const price = parseFloat(item.unit_price || '0');
    return sum + qty * price;
  }, 0);

  const generateAIRecommendations = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/po-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.filter((item) => item.item_name),
        }),
      });

      if (!response.ok) throw new Error('AI service unavailable');

      const { suggestedItems, suggestedSuppliers } = await response.json();

      if (suggestedItems && suggestedItems.length > 0) {
        toast({
          title: 'AI Recommendations',
          description: `Found ${suggestedItems.length} suggested items and ${suggestedSuppliers?.length || 0} suppliers`,
        });
        // Could add these to a recommendations panel
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Service Unavailable',
        description: 'AI recommendations are not available.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = async (data: POFormData) => {
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

      // Calculate total
      const total = data.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity || '0');
        const price = parseFloat(item.unit_price || '0');
        return sum + qty * price;
      }, 0);

      const poData = {
        org_id: orgMember.org_id,
        po_number: purchaseOrder?.po_number || undefined, // Will be auto-generated if new
        supplier_name: data.supplier_name,
        supplier_email: data.supplier_email || null,
        supplier_phone: data.supplier_phone || null,
        supplier_address: data.supplier_address || null,
        order_date: data.order_date || new Date().toISOString().split('T')[0],
        expected_delivery_date: data.expected_delivery_date || null,
        status: data.status,
        total_amount: total,
        currency: data.currency,
        notes: data.notes || null,
        created_by: user.id,
      };

      let poId: string;

      if (purchaseOrder) {
        const { data: updated, error } = await supabase
          .from('purchase_orders')
          .update(poData)
          .eq('id', purchaseOrder.id)
          .select()
          .single();

        if (error) throw error;
        poId = updated.id;

        // Delete existing items
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('po_id', poId);
      } else {
        // Generate PO number
        const { data: lastPO } = await supabase
          .from('purchase_orders')
          .select('po_number')
          .eq('org_id', orgMember.org_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let poNumber = 'PO-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '-0001';
        if (lastPO?.po_number) {
          const match = lastPO.po_number.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1]) + 1;
            poNumber = lastPO.po_number.replace(/-\d+$/, `-${num.toString().padStart(4, '0')}`);
          }
        }

        const { data: created, error } = await supabase
          .from('purchase_orders')
          .insert({ ...poData, po_number: poNumber })
          .select()
          .single();

        if (error) throw error;
        poId = created.id;
      }

      // Insert items
      const itemsToInsert = data.items.map((item) => ({
        po_id: poId,
        item_name: item.item_name,
        description: item.description || null,
        quantity: parseFloat(item.quantity || '0'),
        unit: item.unit || 'each',
        unit_price: parseFloat(item.unit_price || '0'),
        total_price: parseFloat(item.quantity || '0') * parseFloat(item.unit_price || '0'),
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: purchaseOrder ? 'Purchase order updated' : 'Purchase order created',
        description: 'Purchase order has been saved successfully.',
      });

      router.push('/app/admin/purchase-orders');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving PO:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save purchase order',
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
                <CardTitle>Supplier Information</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAIRecommendations}
                  disabled={isGeneratingAI}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingAI ? 'Loading...' : 'AI Recommendations'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supplier_name">
                  Supplier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplier_name"
                  {...register('supplier_name')}
                  className="h-14"
                />
                {errors.supplier_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.supplier_name.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_email">Email</Label>
                  <Input
                    id="supplier_email"
                    type="email"
                    {...register('supplier_email')}
                    className="h-14"
                  />
                </div>
                <div>
                  <Label htmlFor="supplier_phone">Phone</Label>
                  <Input
                    id="supplier_phone"
                    type="tel"
                    {...register('supplier_phone')}
                    className="h-14"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="supplier_address">Address</Label>
                <Textarea
                  id="supplier_address"
                  {...register('supplier_address')}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    type="date"
                    {...register('order_date')}
                    className="h-14"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="expected_delivery_date">Expected Delivery</Label>
                  <Input
                    id="expected_delivery_date"
                    type="date"
                    {...register('expected_delivery_date')}
                    className="h-14"
                  />
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
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
                      Item Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register(`items.${index}.item_name`)}
                      className="h-14"
                      placeholder="e.g., Cleaning Solution"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      className="h-14"
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
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
                      <Label>Unit</Label>
                      <Select
                        value={watch(`items.${index}.unit`)}
                        onValueChange={(value) =>
                          setValue(`items.${index}.unit`, value)
                        }
                      >
                        <SelectTrigger className="h-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="each">Each</SelectItem>
                          <SelectItem value="case">Case</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="gallon">Gallon</SelectItem>
                          <SelectItem value="lb">Pound</SelectItem>
                        </SelectContent>
                      </Select>
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
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ item_name: '', quantity: '1', unit: 'each', unit_price: '0' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register('notes')}
                placeholder="Additional notes..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {items.length} item(s)
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
            : purchaseOrder
            ? 'Update Purchase Order'
            : 'Create Purchase Order'}
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
