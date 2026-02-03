'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Package, 
  Loader2,
  Search,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku?: string;
  unit_price?: number;
  unit?: string;
  vendors?: { name: string };
}

interface CustomerProduct {
  id: string;
  product_id: string;
  default_quantity: number;
  custom_price?: number;
  notes?: string;
  ship_to_address?: string;
  ship_to_city?: string;
  ship_to_state?: string;
  ship_to_zip?: string;
  products: Product;
}

interface Vendor {
  id: string;
  name: string;
  ship_to_address?: string;
  ship_to_city?: string;
  ship_to_state?: string;
  ship_to_zip?: string;
}

interface CustomerProductManagerProps {
  orgId: string;
  clientId: string;
  clientName: string;
  customerProducts: CustomerProduct[];
  allProducts: Product[];
  vendors: Vendor[];
}

export function CustomerProductManager({
  orgId,
  clientId,
  clientName,
  customerProducts,
  allProducts,
  vendors,
}: CustomerProductManagerProps) {
  const router = useRouter();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [defaultQuantity, setDefaultQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out already assigned products
  const assignedProductIds = customerProducts.map(cp => cp.product_id);
  const availableProducts = allProducts.filter(p => !assignedProductIds.includes(p.id));
  
  // Filter by search
  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase.from('customer_products').insert({
        org_id: orgId,
        client_id: clientId,
        product_id: selectedProductId,
        default_quantity: parseInt(defaultQuantity) || 1,
      });

      if (error) throw error;

      setIsAddingProduct(false);
      setSelectedProductId('');
      setDefaultQuantity('1');
      router.refresh();
    } catch (err) {
      console.error('Failed to add product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProduct = async (customerProductId: string) => {
    setRemovingId(customerProductId);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('customer_products')
        .delete()
        .eq('id', customerProductId);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error('Failed to remove product:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assigned Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-500" />
              Assigned Products
            </CardTitle>
            <CardDescription>Products this customer regularly orders</CardDescription>
          </div>
          <Button onClick={() => setIsAddingProduct(true)} disabled={isAddingProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {customerProducts.length > 0 ? (
            <div className="space-y-3">
              {customerProducts.map((cp) => (
                <div 
                  key={cp.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <Package className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cp.products.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {cp.products.sku && <span>SKU: {cp.products.sku}</span>}
                        {cp.products.vendors?.name && (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {cp.products.vendors.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant="outline">Qty: {cp.default_quantity}</Badge>
                      {(cp.custom_price ?? cp.products.unit_price) && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(cp.custom_price ?? cp.products.unit_price ?? 0)}/{cp.products.unit || 'each'}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveProduct(cp.id)}
                      disabled={removingId === cp.id}
                    >
                      {removingId === cp.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-3">No products assigned yet</p>
              <Button onClick={() => setIsAddingProduct(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      {isAddingProduct && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle>Add Product to {clientName}</CardTitle>
            <CardDescription>Select a product to add to this customer&apos;s regular order list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Product</Label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a product...</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ''} 
                    {product.unit_price ? ` - ${formatCurrency(product.unit_price)}` : ''}
                  </option>
                ))}
              </select>
              {filteredProducts.length === 0 && (
                <p className="text-sm text-gray-500">
                  {availableProducts.length === 0 
                    ? 'All products have been assigned' 
                    : 'No products match your search'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultQuantity">Default Quantity</Label>
              <Input
                id="defaultQuantity"
                type="number"
                min="1"
                value={defaultQuantity}
                onChange={(e) => setDefaultQuantity(e.target.value)}
                className="w-32"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingProduct(false);
                  setSelectedProductId('');
                  setSearchQuery('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddProduct}
                disabled={!selectedProductId || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
