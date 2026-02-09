import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * QuickBooks OAuth callback. Exchange code for tokens and store in integration_tokens.
 * TODO: Implement with QuickBooks client_id, client_secret, exchange code for access/refresh tokens.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // org_id
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/operator/finance?qb=error&message=${encodeURIComponent(error)}`, request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/operator/finance?qb=missing', request.url));
  }

  const supabase = await createClient();
  // TODO: Exchange code for tokens via QuickBooks API, then:
  // await supabase.from('integration_tokens').upsert({ org_id: state, provider: 'quickbooks', access_token, refresh_token, expires_at });
  // await supabase.from('integrations').upsert({ org_id: state, provider: 'quickbooks', status: 'connected' });

  return NextResponse.redirect(new URL('/operator/finance?qb=connected', request.url));
}
