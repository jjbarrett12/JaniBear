import { createClient } from './supabase/server';

export type ProGearFilters = {
  category?: string | null;
  brand?: string | null;
  min_price?: string | null;
  max_price?: string | null;
};

export async function getFilteredProGearProducts(
  filters: ProGearFilters,
  options?: { category?: string; featuredOnly?: boolean }
) {
  const supabase = await createClient();
  let query = supabase
    .from('pro_gear_products')
    .select('*')
    .eq('active', true);

  const category = options?.category ?? filters.category;
  if (category && ['gloves', 'equipment'].includes(category)) {
    query = query.eq('category', category);
  }

  if (filters.brand) {
    query = query.eq('brand', filters.brand);
  }

  if (filters.min_price) {
    const cents = Math.round(parseFloat(filters.min_price) * 100);
    if (!isNaN(cents)) query = query.gte('member_price_cents', cents);
  }

  if (filters.max_price) {
    const cents = Math.round(parseFloat(filters.max_price) * 100);
    if (!isNaN(cents)) query = query.lte('member_price_cents', cents);
  }

  if (options?.featuredOnly) {
    query = query.eq('featured', true);
  }

  query = query.order('featured', { ascending: false }).order('name');
  const { data } = await query;
  return data ?? [];
}

export async function getProGearBrands(category?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from('pro_gear_products')
    .select('brand')
    .eq('active', true)
    .not('brand', 'is', null);
  if (category && ['gloves', 'equipment'].includes(category)) {
    query = query.eq('category', category);
  }
  const { data } = await query;
  const brands = [...new Set((data ?? []).map((r) => r.brand as string).filter(Boolean))].sort();
  return brands;
}
