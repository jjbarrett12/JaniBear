'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addToCartAction(productId: string, quantity: number) {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data: product } = await supabase
    .from('pro_gear_products')
    .select('id, member_price_cents')
    .eq('id', productId)
    .eq('active', true)
    .single();
  if (!product) return false;

  const unitPrice = product.member_price_cents;
  const lineTotal = unitPrice * quantity;

  let { data: draftOrder } = await supabase
    .from('pro_gear_orders')
    .select('id, subtotal_cents')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!draftOrder) {
    const { data: newOrder, error: orderError } = await supabase
      .from('pro_gear_orders')
      .insert({
        user_id: user.id,
        status: 'draft',
        subtotal_cents: lineTotal,
        shipping_cents: 0,
        total_cents: lineTotal,
      })
      .select('id, subtotal_cents')
      .single();
    if (orderError || !newOrder) return false;
    draftOrder = newOrder;
  } else {
    const newSubtotal = draftOrder.subtotal_cents + lineTotal;
    await supabase
      .from('pro_gear_orders')
      .update({
        subtotal_cents: newSubtotal,
        total_cents: newSubtotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftOrder.id);
  }

  const { error: itemError } = await supabase.from('pro_gear_order_items').insert({
    order_id: draftOrder.id,
    product_id: productId,
    quantity,
    unit_price_cents: unitPrice,
    line_total_cents: lineTotal,
  });
  if (itemError) return false;

  revalidatePath('/app/pro-gear');
  revalidatePath('/app/pro-gear/cart');
  return true;
}

export async function updateCartItemQuantityAction(
  orderItemId: string,
  quantity: number
) {
  const user = await getCurrentUser();
  if (!user || quantity < 1) return false;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from('pro_gear_order_items')
    .select('id, order_id, unit_price_cents')
    .eq('id', orderItemId)
    .single();
  if (!item) return false;

  const { data: order } = await supabase
    .from('pro_gear_orders')
    .select('id, user_id')
    .eq('id', item.order_id)
    .single();
  if (!order || order.user_id !== user.id || order.user_id === undefined) return false;

  const lineTotal = item.unit_price_cents * quantity;
  await supabase
    .from('pro_gear_order_items')
    .update({ quantity, line_total_cents: lineTotal })
    .eq('id', orderItemId);

  const { data: items } = await supabase
    .from('pro_gear_order_items')
    .select('line_total_cents')
    .eq('order_id', order.id);
  const subtotal = items?.reduce((s, i) => s + i.line_total_cents, 0) ?? 0;
  await supabase
    .from('pro_gear_orders')
    .update({
      subtotal_cents: subtotal,
      total_cents: subtotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  revalidatePath('/app/pro-gear/cart');
  return true;
}

export async function removeCartItemAction(orderItemId: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from('pro_gear_order_items')
    .select('id, order_id')
    .eq('id', orderItemId)
    .single();
  if (!item) return false;

  const { data: order } = await supabase
    .from('pro_gear_orders')
    .select('id, user_id')
    .eq('id', item.order_id)
    .single();
  if (!order || order.user_id !== user.id) return false;

  await supabase.from('pro_gear_order_items').delete().eq('id', orderItemId);

  const { data: items } = await supabase
    .from('pro_gear_order_items')
    .select('line_total_cents')
    .eq('order_id', order.id);
  const subtotal = items?.reduce((s, i) => s + i.line_total_cents, 0) ?? 0;
  await supabase
    .from('pro_gear_orders')
    .update({
      subtotal_cents: subtotal,
      total_cents: subtotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  revalidatePath('/app/pro-gear/cart');
  return true;
}

export type ProGearPaymentType = 'one_time' | 'financed';

/** Submit order as financed (invoice/financing). For one-time payment use checkout session instead. */
export async function submitOrderRequestAction(
  orderId: string,
  notes?: string,
  paymentType: ProGearPaymentType = 'financed'
) {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from('pro_gear_orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .single();
  if (!order || order.user_id !== user.id || order.status !== 'draft') return false;

  const { error } = await supabase
    .from('pro_gear_orders')
    .update({
      status: 'submitted',
      payment_type: paymentType,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (error) return false;

  revalidatePath('/app/pro-gear/cart');
  revalidatePath('/app/pro-gear/orders');
  return true;
}

export async function createPrivateLabelInquiryAction(
  productId: string,
  data: {
    company_name?: string;
    contact_name: string;
    email: string;
    phone?: string;
    estimated_quantity?: number;
    notes?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { error } = await supabase.from('pro_gear_private_label_inquiries').insert({
    product_id: productId,
    user_id: user.id,
    company_name: data.company_name ?? null,
    contact_name: data.contact_name,
    email: data.email,
    phone: data.phone ?? null,
    estimated_quantity: data.estimated_quantity ?? null,
    notes: data.notes ?? null,
    status: 'new',
  });
  if (error) return false;
  revalidatePath('/app/pro-gear/admin/private-label-inquiries');
  return true;
}

export async function submitLargeOpportunityAction(data: {
  contact_name: string;
  email: string;
  company_name?: string;
  phone?: string;
  estimated_quantity?: string;
  estimated_value_cents?: number;
  message?: string;
}) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from('pro_gear_contact_requests').insert({
    user_id: user?.id ?? null,
    contact_name: data.contact_name.trim(),
    email: data.email.trim(),
    company_name: data.company_name?.trim() || null,
    phone: data.phone?.trim() || null,
    estimated_quantity: data.estimated_quantity?.trim() || null,
    estimated_value_cents: data.estimated_value_cents ?? null,
    message: data.message?.trim() || null,
    status: 'new',
  });
  if (error) return false;
  revalidatePath('/app/pro-gear');
  revalidatePath('/app/pro-gear/admin/contact-requests');
  return true;
}
