import { NextResponse } from 'next/server';
import { getUserContext, hasModule, hasCap } from '@/lib/user-context';

/** Start QuickBooks OAuth. Gated by Finance module + can_connect_quickbooks or finance/admin role. */
export async function GET() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) return NextResponse.json({ error: 'No active org' }, { status: 401 });
  if (!hasModule(context, 'finance')) return NextResponse.json({ error: 'Finance module not enabled' }, { status: 403 });
  const canConnect = hasCap(context, 'can_connect_quickbooks') || ['op_finance', 'op_admin', 'fr_finance', 'fr_admin'].includes(context.roleEnum ?? '');
  if (!canConnect) return NextResponse.json({ error: 'Insufficient permission' }, { status: 403 });
  return NextResponse.json({ message: 'QuickBooks OAuth not implemented; add client_id and redirect_uri', placeholder: true });
}
