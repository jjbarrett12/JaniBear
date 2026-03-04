'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

type FilterParams = {
  category?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
};

export function StorefrontFilters({
  brands,
  currentCategory,
}: {
  brands: string[];
  currentCategory?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? currentCategory ?? '';
  const brand = searchParams.get('brand') ?? '';
  const minPrice = searchParams.get('min_price') ?? '';
  const maxPrice = searchParams.get('max_price') ?? '';

  function apply(filters: FilterParams) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v));
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasFilters = category || brand || minPrice || maxPrice;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      {!currentCategory && (
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select
            value={category || 'all'}
            onValueChange={(v) => apply({ ...getCurrent(), category: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="gloves">Gloves</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {brands.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Brand</Label>
          <Select
            value={brand || 'all'}
            onValueChange={(v) => apply({ ...getCurrent(), brand: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Min $</Label>
        <Input
          type="number"
          min={0}
          step={1}
          placeholder="0"
          className="w-24 h-9"
          value={minPrice}
          onChange={(e) => apply({ ...getCurrent(), min_price: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Max $</Label>
        <Input
          type="number"
          min={0}
          step={1}
          placeholder="Any"
          className="w-24 h-9"
          value={maxPrice}
          onChange={(e) => apply({ ...getCurrent(), max_price: e.target.value || undefined })}
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-9 gap-1" onClick={clearFilters}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );

  function getCurrent(): FilterParams {
    return {
      category: category || undefined,
      brand: brand || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
    };
  }
}
