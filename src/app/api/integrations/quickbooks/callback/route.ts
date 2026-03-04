import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeQuickBooksCode, getQuickBooksConfigFromEnv } from '@/lib/quickbooks-oauth';

const FINANCIAL_HEALTH_PATH = '/app/financial-health';

/**
 * QuickBooks OAuth callback. Exchange code for tokens and store in integration_tokens + integrations.
 * Intuit redirects here with code, state (org_id), and realmId (QuickBooks company ID).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // org_id
  const realmId = searchParams.get('realmId'); // QuickBooks company ID
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const origin = request.nextUrl.origin;
  const baseRedirect = new URL(FINANCIAL_HEALTH_PATH, origin);

  if (error) {
    const message = errorDescription || error;
    baseRedirect.searchParams.set('qb', 'error');
    baseRedirect.searchParams.set('message', message);
    return NextResponse.redirect(baseRedirect);
  }
  if (!code || !state) {
    baseRedirect.searchParams.set('qb', 'missing');
    return NextResponse.redirect(baseRedirect);
  }

  const config = getQuickBooksConfigFromEnv(origin);
  if (!config) {
    baseRedirect.searchParams.set('qb', 'error');
    baseRedirect.searchParams.set('message', 'QuickBooks not configured');
    return NextResponse.redirect(baseRedirect);
  }

  try {
    const tokens = await exchangeQuickBooksCode(config, code, config.redirectUri);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const supabase = await createClient();

    await supabase.from('integration_tokens').upsert(
      {
        org_id: state,
        provider: 'quickbooks',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        metadata: realmId ? { realm_id: realmId } : {},
      },
      { onConflict: 'org_id,provider' }
    );

    await supabase.from('integrations').upsert(
      {
        org_id: state,
        provider: 'quickbooks',
        status: 'connected',
        metadata: realmId ? { realm_id: realmId } : {},
      },
      { onConflict: 'org_id,provider' }
    );

    baseRedirect.searchParams.set('qb', 'connected');
    return NextResponse.redirect(baseRedirect);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Token exchange failed';
    baseRedirect.searchParams.set('qb', 'error');
    baseRedirect.searchParams.set('message', message);
    return NextResponse.redirect(baseRedirect);
  }
}
