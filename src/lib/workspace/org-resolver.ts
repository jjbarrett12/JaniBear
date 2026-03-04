/**
 * Workspace org resolution: subdomain or /org/[slug] path.
 * Used by middleware to resolve orgId and optionally rewrite URL.
 */

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'janibear.com';

export type OrgResolution =
  | { type: 'none' }
  | { type: 'subdomain'; orgSlug: string; host: string }
  | { type: 'path'; orgSlug: string; pathPrefix: string; rewritePath: string };

/**
 * Extract org slug from request.
 * - Subdomain: acme.janibear.com -> orgSlug = acme (when host ends with .janibear.com / ROOT_DOMAIN)
 * - Path: /org/acme/app/dashboard -> orgSlug = acme, rewritePath = /app/dashboard
 */
export function getOrgSlugFromRequest(host: string, pathname: string): OrgResolution {
  const hostLower = host.toLowerCase().replace(/^https?:\/\//, '').split('/')[0] ?? '';
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;

  // Path fallback: /org/{slug}/... or /org/{slug}
  const orgPathMatch = path.match(/^\/org\/([a-z0-9\-]+)(?:\/(.*))?$/i);
  if (orgPathMatch) {
    const orgSlug = orgPathMatch[1];
    const rest = orgPathMatch[2] ?? '';
    const rewritePath = rest ? `/${rest}` : '/app/dashboard';
    return { type: 'path', orgSlug, pathPrefix: `/org/${orgSlug}`, rewritePath };
  }

  // Subdomain: subdomain.root.com (skip "www")
  const root = ROOT_DOMAIN.toLowerCase();
  if (hostLower.endsWith(`.${root}`) || hostLower === root) {
    const sub = hostLower.slice(0, -root.length - 1);
    if (sub && sub !== 'www') return { type: 'subdomain', orgSlug: sub, host: hostLower };
  }

  return { type: 'none' };
}

/**
 * Marketing root URL (for redirect when org slug unknown).
 */
export function getMarketingRootUrl(requestUrl: URL): string {
  const proto = requestUrl.protocol;
  return `${proto}//${ROOT_DOMAIN}`;
}

/** When true, use path-based workspace URLs (/org/{slug}/app/...) instead of subdomain (e.g. for local dev without wildcard). */
export const DEV_WORKSPACE_MODE_PATH =
  process.env.NEXT_PUBLIC_DEV_WORKSPACE_MODE === 'path';

/**
 * Workspace URL for a given org slug. In path mode (dev fallback) returns /org/{slug}/app/dashboard;
 * otherwise https://{slug}.{ROOT_DOMAIN}/app/dashboard (or http in dev).
 */
export function getWorkspaceDashboardUrl(slug: string): string {
  if (DEV_WORKSPACE_MODE_PATH) {
    return `/org/${slug}/app/dashboard`;
  }
  const protocol =
    typeof window !== 'undefined'
      ? (window.location?.protocol ?? 'http:')
      : process.env.NODE_ENV === 'production'
        ? 'https:'
        : 'http:';
  return `${protocol}//${slug}.${ROOT_DOMAIN}/app/dashboard`;
}
