import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgSlugFromRequest } from '@/lib/workspace/org-resolver';

const DEFAULT_NAME = 'JANIBEAR';
const BASE_MANIFEST = {
  short_name: 'JANIBEAR',
  description: 'The operating system for commercial cleaning. Win bids. Keep accounts. Catch margin leaks.',
  start_url: '/auth/login',
  display: 'standalone' as const,
  background_color: '#0f172a',
  theme_color: '#3b82f6',
  orientation: 'any' as const,
  scope: '/',
  icons: [
    { src: '/icon-pwa.png', sizes: '192x192', type: 'image/png', purpose: 'any' as const },
    { src: '/icon-pwa.png', sizes: '512x512', type: 'image/png', purpose: 'any' as const },
    { src: '/icon-pwa.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
    { src: '/icon-pwa.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
  ],
  categories: ['business', 'productivity'],
  shortcuts: [
    { name: 'Dashboard', short_name: 'Dashboard', description: 'Open workspace dashboard', url: '/app/dashboard', icons: [{ src: '/icon-pwa.png', sizes: '192x192' }] },
    { name: 'New Inspection', short_name: 'Inspect', description: 'Start a new inspection', url: '/app/inspections/start', icons: [{ src: '/icon-pwa.png', sizes: '192x192' }] },
    { name: 'My Tasks', short_name: 'Tasks', description: 'View my tasks', url: '/app/tasks', icons: [{ src: '/icon-pwa.png', sizes: '192x192' }] },
  ],
};

/**
 * Dynamic manifest: when request is from a workspace host (subdomain or path),
 * lookup org display_name and return name as "JANIBEAR — {displayName}".
 */
export async function GET(request: NextRequest) {
  const host = request.nextUrl.host ?? request.headers.get('host') ?? '';
  const resolution = getOrgSlugFromRequest(host, '/');

  let name = DEFAULT_NAME;
  if (resolution.type === 'subdomain' || resolution.type === 'path') {
    const supabase = await createClient();
    const { data: orgId } = await supabase.rpc('get_org_id_by_slug', { p_slug: resolution.orgSlug });
    if (orgId) {
      const { data: settings } = await supabase
        .from('org_settings')
        .select('display_name')
        .eq('org_id', orgId)
        .maybeSingle();
      const orgName = settings?.display_name?.trim();
      const { data: org } = await supabase.from('organizations').select('name').eq('id', orgId).maybeSingle();
      const displayName = orgName || org?.name || resolution.orgSlug;
      name = `JANIBEAR — ${displayName}`;
    }
  }

  const manifest = { ...BASE_MANIFEST, name };
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
