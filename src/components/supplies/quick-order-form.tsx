'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Loader2, 
  Truck, 
  MapPin,
  CreditCard,
  Package,
  Plus,
  Trash2,
  ShoppingCart,
  Send
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  bill_to_company?: string;
  bill_to_address?: string;
  bill_to_city?: string;
  bill_to_state?: string;
  bill_to_zip?: string;
  ship_to_company?: string;
  ship_to_address?: string;
  ship_to_city?: string;
  ship_to_state?: string;
  ship_to_zip?: string;
  is_preferred?: boolean;
}

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  unit_price?: number;
  unit?: string;
  vendor_id?: string;
  vendors?: { name: string };
}

interface CustomerProduct {
  id: string;
  product_id: string;
  default_quantity: number;
  custom_price?: number;
  products: Product;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

interface QuickOrderFormProps {
  orgId: string;
  userId: string;
  vendors: Vendor[];
  clients: Client[];
  products: Product[];
  customerProducts: CustomerProduct[];
  selectedClientId?: string;
  selectedVendorId?: string;
  organization?: {
    name?: string;
  };
}

export function QuickOrderForm({
  orgId,
  userId,
  vendors,
  clients,
  products,
  customerProducts,
  selectedClientId,
  selectedVendorId,
  organization,
}: QuickOrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState(selectedVendorId || '');
  const [clientId, setClientId] = useState(selectedClientId || '');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Address state
  const [billTo, setBillTo] = useState({
    company: organization?.name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  
  const [shipTo, setShipTo] = useState({
    company: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  // Order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Load customer products when client changes
  useEffect(() => {
    if (customerProducts.length > 0) {
      const items = customerProducts.map(cp => ({
        productId: cp.product_id,
        name: cp.products.name,
        quantity: cp.default_quantity,
        unitPrice: cp.custom_price ?? cp.products.unit_price ?? 0,
        unit: cp.products.unit || 'each',
      }));
      setOrderItems(items);
    }
  }, [customerProducts]);

  // Auto-populate addresses when vendor changes
  useEffect(() => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      if (vendor.bill_to_company || vendor.bill_to_address) {
        setBillTo({
          company: vendor.bill_to_company || organization?.name || '',
          address: vendor.bill_to_address || '',
          city: vendor.bill_to_city || '',
          state: vendor.bill_to_state || '',
          zip: vendor.bill_to_zip || '',
        });
      }
      if (vendor.ship_to_company || vendor.ship_to_address) {
        setShipTo({
          company: vendor.ship_to_company || '',
          address: vendor.ship_to_address || '',
          city: vendor.ship_to_city || '',
          state: vendor.ship_to_state || '',
          zip: vendor.ship_to_zip || '',
        });
      }
    }
  }, [vendorId, vendors, organization]);

  const addItem = () => {
    setOrderItems([...orderItems, {
      productId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'each',
    }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index] = {
          ...updated[index],
          productId: product.id,
          name: product.name,
          unitPrice: product.unit_price || 0,
          unit: product.unit || 'each',
        };
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setOrderItems(updated);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent, sendToVendor: boolean = false) => {
    e.preventDefault();
    
    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }
    
    if (orderItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const vendor = vendors.find(v => v.id === vendorId);

      // Generate PO number if not provided
      let finalPoNumber = poNumber;
      if (!finalPoNumber) {
        const { data: lastPo } = await supabase
          .from('purchase_orders')
          .select('po_number')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        const lastNum = lastPo?.po_number?.match(/PO-(\d+)/)?.[1];
        const nextNum = lastNum ? parseInt(lastNum) + 1 : 1;
        finalPoNumber = `PO-${String(nextNum).padStart(6, '0')}`;
      }

      // Create PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: orgId,
          po_number: finalPoNumber,
          vendor_id: vendorId,
          supplier_name: vendor?.name || '',
          supplier_email: vendor?.email || null,
          client_id: clientId || null,
          status: sendToVendor ? 'ordered' : 'draft',
          total_amount: calculateTotal(),
          bill_to_company: billTo.company,
          bill_to_address: billTo.address,
          bill_to_city: billTo.city,
          bill_to_state: billTo.state,
          bill_to_zip: billTo.zip,
          ship_to_company: shipTo.company,
          ship_to_address: shipTo.address,
          ship_to_city: shipTo.city,
          ship_to_state: shipTo.state,
          ship_to_zip: shipTo.zip,
          notes,
          created_by: userId,
          sent_to_vendor_at: sendToVendor ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO items
      const poItems = orderItems.map(item => ({
        po_id: po.id,
        product_id: item.productId || null,
        item_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      // If sending to vendor, could send email here
      if (sendToVendor && vendor?.email) {
        // TODO: Implement email sending via API
        console.log('Would send PO to:', vendor.email);
      }

      router.push(`/app/admin/purchase-orders/${po.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6">
      {/* Vendor & Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <select
                id="vendor"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} {vendor.is_preferred ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Customer (optional)</Label>
              <select
                id="client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No specific customer</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="poNumber">PO Number (auto-generated if blank)</Label>
            <Input
              id="poNumber"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="PO-000001"
            />
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bill To */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Bill To
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={billTo.company}
              onChange={(e) => setBillTo({ ...billTo, company: e.target.value })}
              placeholder="Company Name"
            />
            <Input
              value={billTo.address}
              onChange={(e) => setBillTo({ ...billTo, address: e.target.value })}
              placeholder="Street Address"
            />
            <div className="grid gap-2 grid-cols-3">
              <Input
                value={billTo.city}
                onChange={(e) => setBillTo({ ...billTo, city: e.target.value })}
                placeholder="City"
              />
              <Input
                value={billTo.state}
                onChange={(e) => setBillTo({ ...billTo, state: e.target.value })}
                placeholder="State"
              />
              <Input
                value={billTo.zip}
                onChange={(e) => setBillTo({ ...billTo, zip: e.target.value })}
                placeholder="ZIP"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ship To */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-blue-500" />
              Ship To
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={shipTo.company}
              onChange={(e) => setShipTo({ ...shipTo, company: e.target.value })}
              placeholder="Company Name"
            />
            <Input
              value={shipTo.address}
              onChange={(e) => setShipTo({ ...shipTo, address: e.target.value })}
              placeholder="Street Address"
            />
            <div className="grid gap-2 grid-cols-3">
              <Input
                value={shipTo.city}
                onChange={(e) => setShipTo({ ...shipTo, city: e.target.value })}
                placeholder="City"
              />
              <Input
                value={shipTo.state}
                onChange={(e) => setShipTo({ ...shipTo, state: e.target.value })}
                placeholder="State"
              />
              <Input
                value={shipTo.zip}
                onChange={(e) => setShipTo({ ...shipTo, zip: e.target.value })}
                placeholder="ZIP"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-500" />
              Order Items
            </CardTitle>
            <CardDescription>Products to order</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {orderItems.length > 0 ? (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 px-2">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
              
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                  <div className="col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-white px-2 text-sm"
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="text-center h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="text-right h-9"
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Order Total</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-3">No items added yet</p>
              <Button type="button" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="notes">Order Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions, delivery notes, etc."
            rows={3}
            className="mt-2"
          />
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button 
          type="button"
          variant="outline"
          onClick={(e) => handleSubmit(e, false)}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
          Save as Draft
        </Button>
        <Button 
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Create & Send to Vendor
        </Button>
      </div>
    </form>
  );
}
