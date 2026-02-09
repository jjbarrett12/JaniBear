import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/org/list
 * Returns all organizations the current user is a member of (id, name, org_type).
 * Used by the org switcher so users can switch between Franchisor / Franchisee / Independent for testing.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id, organizations(id, name, org_type)')
    .eq('user_id', user.id);

  const orgs = (memberships ?? [])
    .map((m: { org_id: string; organizations: { id: string; name: string; org_type: string } | null }) => {
      const org = m.organizations;
      if (!org) return null;
      return { id: org.id, name: org.name, org_type: org.org_type ?? 'independent' };
    })
    .filter(Boolean);

  return NextResponse.json({ orgs });
}
