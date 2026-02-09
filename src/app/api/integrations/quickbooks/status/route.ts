import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserContext, hasModule } from '@/lib/user-context';

/**
 * Get QuickBooks connection status for current org.
 * Gated by Finance module.
 */
export async function GET() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) {
    return NextResponse.json({ error: 'No active org' }, { status: 401 });
  }
  if (!hasModule(context, 'finance')) {
    return NextResponse.json({ error: 'Finance module not enabled' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: integration } = await supabase
    .from('integrations')
    .select('status, metadata')
    .eq('org_id', context.activeOrgId)
    .eq('provider', 'quickbooks')
    .maybeSingle();

  return NextResponse.json({
    connected: integration?.status === 'connected',
    status: integration?.status ?? 'disconnected',
  });
}
