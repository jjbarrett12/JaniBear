import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(500),
  industry: z.string().max(200).optional(),
});

/**
 * POST /api/orgs — Create a new organization (current user becomes owner).
 * Used by onboarding. Calls create_org_for_signup RPC.
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
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!orgId) {
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }

  return NextResponse.json({ org_id: orgId });
}
