import { NextResponse } from 'next/server';
import { getUserContext, hasModule } from '@/lib/user-context';

/**
 * Stub: Sync invoices from QuickBooks.
 * TODO: Implement when QuickBooks integration is complete. Tier-gated (Finance + QB entitlement).
 */
export async function POST() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) {
    return NextResponse.json({ error: 'No active org' }, { status: 401 });
  }
  if (!hasModule(context, 'finance')) {
    return NextResponse.json({ error: 'Finance module not enabled' }, { status: 403 });
  }

  return NextResponse.json({
    message: 'QuickBooks invoice sync not implemented',
    placeholder: true,
  });
}
