/**
 * QuickBooks Online OAuth 2.0 — auth URL and token exchange.
 * Keep onboarding simple: one redirect to Intuit, one callback to store tokens.
 * See: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
 */

const INTUIT_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const INTUIT_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const SCOPE = 'com.intuit.quickbooks.accounting';

export type QuickBooksConfig = {
  clientId: string;
  clientSecret: string;
  /** Full redirect URI (must match Intuit app keys), e.g. https://yourapp.com/api/integrations/quickbooks/callback */
  redirectUri: string;
  /** Use sandbox (development) or production */
  useSandbox?: boolean;
};

/**
 * Build the URL to send the user to Intuit to authorize.
 * state = org_id so we can associate the connection with the right org on callback.
 */
export function buildQuickBooksAuthUrl(config: QuickBooksConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: config.redirectUri,
    state,
  });
  return `${INTUIT_AUTH_URL}?${params.toString()}`;
}

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
};

/**
 * Exchange the authorization code for access and refresh tokens.
 * Callback from Intuit includes code and realmId; redirect_uri must match exactly.
 */
export async function exchangeQuickBooksCode(
  config: QuickBooksConfig,
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const res = await fetch(INTUIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QuickBooks token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in?: number;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Get config from env. Returns null if not configured (so UI can show "Connect" without errors).
 */
export function getQuickBooksConfigFromEnv(origin: string): QuickBooksConfig | null {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI ?? `${origin}/api/integrations/quickbooks/callback`;
  return {
    clientId,
    clientSecret,
    redirectUri,
    useSandbox: process.env.QUICKBOOKS_SANDBOX === 'true',
  };
}
