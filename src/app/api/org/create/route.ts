import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(500),
  org_type: z.enum(['franchisor', 'franchisee', 'independent']).optional(),
});

/**
 * POST /api/org/create — Create org + set owner (for onboarding wizard Step 1).
 * Calls create_org_for_signup then sets organizations.owner_user_id.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: orgId, error } = await auth.supabase.rpc('create_org_for_signup', {
    org_name: parsed.data.name.trim(),
    owner_user_id: auth.userId,
    p_org_type: parsed.data.org_type ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!orgId) {
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }

  await auth.supabase
    .from('organizations')
    .update({ owner_user_id: auth.userId })
    .eq('id', orgId);

  return NextResponse.json({ org_id: orgId });
}
