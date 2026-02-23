import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, hasModule, hasCap } from '@/lib/user-context';
import { buildQuickBooksAuthUrl, getQuickBooksConfigFromEnv } from '@/lib/quickbooks-oauth';

/**
 * Start QuickBooks OAuth: redirect user to Intuit to authorize.
 * Gated by Finance module + can_connect_quickbooks or finance/admin role.
 * Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET (and optionally
 * QUICKBOOKS_REDIRECT_URI) in env. Redirect URI must be listed in your Intuit app keys.
 */
export async function GET(request: NextRequest) {
  const { context } = await getUserContext();
  if (!context.activeOrgId) {
    return NextResponse.json({ error: 'No active org' }, { status: 401 });
  }
  if (!hasModule(context, 'finance')) {
    return NextResponse.json({ error: 'Finance module not enabled' }, { status: 403 });
  }
  const canConnect =
    hasCap(context, 'can_connect_quickbooks') ||
    ['op_finance', 'op_admin', 'fr_finance', 'fr_admin'].includes(context.roleEnum ?? '');
  if (!canConnect) {
    return NextResponse.json({ error: 'Insufficient permission' }, { status: 403 });
  }

  const origin = request.nextUrl.origin;
  const config = getQuickBooksConfigFromEnv(origin);
  if (!config) {
    return NextResponse.json(
      {
        error: 'QuickBooks not configured',
        hint: 'Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET in environment.',
      },
      { status: 503 }
    );
  }

  const authUrl = buildQuickBooksAuthUrl(config, context.activeOrgId);
  return NextResponse.redirect(authUrl);
}
