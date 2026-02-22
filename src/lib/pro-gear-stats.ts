import { createClient } from './supabase/server';

export type ProGearLiveStats = {
  membersSavedThisMonthCents: number;
  ordersShippedThisMonth: number;
  avgDiscountPercent: number;
  autoReorderPercent: number;
};

/** Org-scoped stats for LiveStatsBar. */
export async function getProGearStatsForOrg(orgId: string): Promise<ProGearLiveStats> {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const iso = startOfMonth.toISOString();

  const { data: orders } = await supabase
    .from('pro_gear_orders')
    .select('id, status, total_cents, savings_total_cents')
    .eq('org_id', orgId)
    .neq('status', 'draft')
    .gte('created_at', iso);

  const membersSavedThisMonthCents =
    orders?.reduce((s, o) => s + (o.savings_total_cents ?? 0), 0) ?? 0;
  const ordersShippedThisMonth =
    orders?.filter((o) => o.status === 'shipped').length ?? 0;
  const withTotal = orders?.filter((o) => o.total_cents > 0) ?? [];
  const avgDiscountPercent =
    withTotal.length > 0
      ? (withTotal.reduce((s, o) => {
          const saved = o.savings_total_cents ?? 0;
          return s + (o.total_cents ? (saved / (o.total_cents + saved)) * 100 : 0);
        }, 0) / withTotal.length)
      : 0;

  const { count: recurringCount } = await supabase
    .from('pro_gear_recurring_orders')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_active', true);
  const totalNonDraft = orders?.length ?? 0;
  const autoReorderPercent =
    totalNonDraft > 0 && (recurringCount ?? 0) > 0
      ? Math.min(100, ((recurringCount ?? 0) / totalNonDraft) * 100)
      : 0;

  return {
    membersSavedThisMonthCents,
    ordersShippedThisMonth,
    avgDiscountPercent: Math.round(avgDiscountPercent * 10) / 10,
    autoReorderPercent: Math.round(autoReorderPercent * 10) / 10,
  };
}

export type SavingsOpportunityProduct = {
  id: string;
  slug: string;
  name: string;
  retail_price_cents: number | null;
  member_price_cents: number;
  savings_cents: number;
  category: string;
};

/** Top products by savings among org's orders; fallback to catalog top by retail-member delta. */
export async function getSavingsOpportunities(
  orgId: string,
  limit: number = 3
): Promise<SavingsOpportunityProduct[]> {
  const supabase = await createClient();

  const { data: orgOrders } = await supabase
    .from('pro_gear_orders')
    .select('id')
    .eq('org_id', orgId)
    .neq('status', 'draft');
  const orderIds = (orgOrders ?? []).map((o) => o.id);
  if (orderIds.length === 0) {
    const { data: products } = await supabase
      .from('pro_gear_products')
      .select('id, slug, name, retail_price_cents, member_price_cents, category')
      .eq('active', true);
    const withSavings = (products ?? [])
      .map((p) => {
        const retail = p.retail_price_cents ?? p.member_price_cents;
        const savings = Math.max(0, retail - p.member_price_cents);
        return { ...p, savings_cents: savings };
      })
      .filter((p) => p.savings_cents > 0)
      .sort((a, b) => b.savings_cents - a.savings_cents)
      .slice(0, limit);
    return withSavings as SavingsOpportunityProduct[];
  }

  const { data: orderItems } = await supabase
    .from('pro_gear_order_items')
    .select('product_id, savings_cents')
    .in('order_id', orderIds);

  const productIds = [...new Set((orderItems ?? []).map((i) => i.product_id))];
  if (productIds.length === 0) {
    const { data: products } = await supabase
      .from('pro_gear_products')
      .select('id, slug, name, retail_price_cents, member_price_cents, category')
      .eq('active', true);
    const withSavings = (products ?? [])
      .map((p) => {
        const retail = p.retail_price_cents ?? p.member_price_cents;
        const savings = Math.max(0, retail - p.member_price_cents);
        return { ...p, savings_cents: savings };
      })
      .filter((p) => p.savings_cents > 0)
      .sort((a, b) => b.savings_cents - a.savings_cents)
      .slice(0, limit);
    return withSavings as SavingsOpportunityProduct[];
  }

  const { data: products } = await supabase
    .from('pro_gear_products')
    .select('id, slug, name, retail_price_cents, member_price_cents, category')
    .eq('active', true)
    .in('id', productIds);
  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const summed = new Map<string, number>();
  for (const i of orderItems ?? []) {
    summed.set(i.product_id, (summed.get(i.product_id) ?? 0) + (i.savings_cents ?? 0));
  }
  const sorted = [...summed.entries()]
    .map(([productId, savings]) => {
      const p = byId.get(productId);
      if (!p) return null;
      return {
        ...p,
        savings_cents: savings,
      } as SavingsOpportunityProduct;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.savings_cents ?? 0) - (a?.savings_cents ?? 0))
    .slice(0, limit);
  return sorted as SavingsOpportunityProduct[];
}

/** Avg savings percent by category (from catalog). */
export async function getCategoryAvgSavings(): Promise<{ gloves: number; equipment: number }> {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('pro_gear_products')
    .select('category, retail_price_cents, member_price_cents')
    .eq('active', true);

  const byCat = { gloves: [] as number[], equipment: [] as number[] };
  for (const p of products ?? []) {
    const retail = p.retail_price_cents ?? p.member_price_cents;
    if (retail <= 0) continue;
    const percent = ((retail - p.member_price_cents) / retail) * 100;
    if (percent > 0 && (p.category === 'gloves' || p.category === 'equipment')) {
      byCat[p.category].push(percent);
    }
  }
  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
  return { gloves: avg(byCat.gloves), equipment: avg(byCat.equipment) };
}
