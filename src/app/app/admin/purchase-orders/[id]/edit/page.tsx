import { redirect, notFound } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { POForm } from '@/components/admin/po-form';

export default async function EditPOPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', userId)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!po) {
    notFound();
  }

  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('po_id', po.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Purchase Order</h1>
        <p className="text-gray-600 mt-2">Update purchase order information</p>
      </div>
      <POForm purchaseOrder={{ ...po, items: items || [] }} />
    </div>
  );
}
