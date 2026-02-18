'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Package, DollarSign, BarChart3 } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
}

interface ProductFormProps {
  orgId: string;
  vendors: Vendor[];
  product?: {
    id: string;
    vendor_id?: string;
    name: string;
    description?: string;
    sku?: string;
    vendor_sku?: string;
    upc?: string;
    category?: string;
    unit?: string;
    unit_price?: number;
    case_pack?: number;
    min_stock_level?: number;
    reorder_quantity?: number;
    is_active?: boolean;
  };
}

const CATEGORIES = [
  'Foodservice & Disposables',
  'Janitorial & Cleaning',
  'Cleaning Chemicals',
  'Paper Products',
  'Trash Liners',
  'Floor Care',
  'Restroom Supplies',
  'Equipment',
  'Safety Supplies',
  'Microfiber',
  'Dispensers',
  'Other',
];

export function ProductForm({ orgId, vendors, product }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vendor_id: product?.vendor_id || '',
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    vendor_sku: product?.vendor_sku || '',
    upc: product?.upc || '',
    category: product?.category || '',
    unit: product?.unit || 'each',
    unit_price: product?.unit_price?.toString() || '',
    case_pack: product?.case_pack?.toString() || '1',
    min_stock_level: product?.min_stock_level?.toString() || '',
    reorder_quantity: product?.reorder_quantity?.toString() || '',
    is_active: product?.is_active ?? true,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const productData = {
        org_id: orgId,
        vendor_id: formData.vendor_id || null,
        name: formData.name,
        description: formData.description || null,
        sku: formData.sku || null,
        vendor_sku: formData.vendor_sku || null,
        upc: formData.upc || null,
        category: formData.category || null,
        unit: formData.unit,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        case_pack: formData.case_pack ? parseInt(formData.case_pack) : 1,
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : null,
        reorder_quantity: formData.reorder_quantity ? parseInt(formData.reorder_quantity) : null,
        is_active: formData.is_active,
        created_by: product ? undefined : user.id,
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
      }

      router.push('/app/supplies/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-500" />
            Product Information
          </CardTitle>
          <CardDescription>Basic product details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="All-Purpose Cleaner"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Product description..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor</Label>
              <select
                id="vendor_id"
                value={formData.vendor_id}
                onChange={(e) => updateField('vendor_id', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sku">Your SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                placeholder="APC-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_sku">Vendor SKU</Label>
              <Input
                id="vendor_sku"
                value={formData.vendor_sku}
                onChange={(e) => updateField('vendor_sku', e.target.value)}
                placeholder="VENDOR-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upc">UPC</Label>
              <Input
                id="upc"
                value={formData.upc}
                onChange={(e) => updateField('upc', e.target.value)}
                placeholder="012345678901"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateField('is_active', checked === true)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Pricing & Units
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price ($)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => updateField('unit_price', e.target.value)}
                placeholder="9.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measure</Label>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="each">Each</option>
                <option value="case">Case</option>
                <option value="gallon">Gallon</option>
                <option value="box">Box</option>
                <option value="roll">Roll</option>
                <option value="pack">Pack</option>
                <option value="bag">Bag</option>
                <option value="pallet">Pallet</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="case_pack">Case Pack</Label>
              <Input
                id="case_pack"
                type="number"
                value={formData.case_pack}
                onChange={(e) => updateField('case_pack', e.target.value)}
                placeholder="12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Reorder Settings
          </CardTitle>
          <CardDescription>Optional inventory management settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => updateField('min_stock_level', e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_quantity">Reorder Quantity</Label>
              <Input
                id="reorder_quantity"
                type="number"
                value={formData.reorder_quantity}
                onChange={(e) => updateField('reorder_quantity', e.target.value)}
                placeholder="24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : product ? (
            'Update Product'
          ) : (
            'Create Product'
          )}
        </Button>
      </div>
    </form>
  );
}
