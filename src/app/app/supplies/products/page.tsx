import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Package, 
  ArrowLeft,
  ArrowRight,
  Search,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search, category } = await searchParams;
  const org = await requireOrg();
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('*, vendors(name)')
    .eq('org_id', org.org_id)
    .order('name', { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: products } = await query;

  // Get categories
  const { data: categories } = await supabase
    .from('products')
    .select('category')
    .eq('org_id', org.org_id)
    .not('category', 'is', null);

  const uniqueCategories = [...new Set(categories?.map(c => c.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/supplies" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link href="/app/supplies/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                name="search"
                defaultValue={search}
                placeholder="Search products..."
                className="pl-10"
              />
            </div>
            <select
              name="category"
              defaultValue={category}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Products List */}
      {products && products.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <Link key={product.id} href={`/app/supplies/products/${product.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <Package className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                          {product.name}
                        </h3>
                        {product.sku && (
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      {product.vendors?.name && (
                        <>
                          <Truck className="h-4 w-4" />
                          <span>{product.vendors.name}</span>
                        </>
                      )}
                    </div>
                    {product.unit_price && (
                      <p className="font-semibold text-emerald-600">
                        {formatCurrency(product.unit_price)}/{product.unit || 'each'}
                      </p>
                    )}
                  </div>

                  {product.category && (
                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end">
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">Add products to your catalog to start ordering</p>
            <Link href="/app/supplies/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
