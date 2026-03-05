import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';
import { requireOrgSeatAdmin } from '@/lib/billing/requireOrgRole';

const ChangePlanSchema = z.object({
  org_id: z.string().uuid(),
  user_id: z.string().uuid(),
  new_plan: z.enum(['cub', 'super_cub', 'grizzly', 'super_grizzly', 'kodiak', 'super_kodiak']),
});

/**
 * POST /api/org/tokens/change-plan — Revoke current token and assign an available token of new plan.
 * If no token available for new_plan, returns 400.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = ChangePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await requireOrgSeatAdmin(parsed.data.org_id);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = auth.supabase;
  const { org_id, user_id, new_plan } = parsed.data;

  const { data: currentToken } = await supabase
    .from('org_seat_tokens')
    .select('id, plan')
    .eq('org_id', org_id)
    .eq('assigned_to_user_id', user_id)
    .eq('status', 'assigned')
    .maybeSingle();

  const { data: availableNew } = await supabase
    .from('org_seat_tokens')
    .select('id')
    .eq('org_id', org_id)
    .eq('plan', new_plan)
    .eq('status', 'available')
    .limit(1)
    .maybeSingle();

  if (!availableNew) {
    return NextResponse.json(
      { error: `No available ${new_plan} token to assign` },
      { status: 400 }
    );
  }

  if (currentToken) {
    await supabase
      .from('org_seat_tokens')
      .update({ status: 'revoked', assigned_to_user_id: null, assigned_by_user_id: null, assigned_at: null })
      .eq('id', currentToken.id)
      .eq('org_id', org_id);
  }

  await supabase
    .from('org_seat_tokens')
    .update({
      assigned_to_user_id: user_id,
      assigned_by_user_id: auth.userId,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    })
    .eq('id', availableNew.id)
    .eq('org_id', org_id);

  await supabase
    .from('org_members')
    .update({ role: new_plan })
    .eq('org_id', org_id)
    .eq('user_id', user_id);

  return NextResponse.json({ ok: true, new_plan });
}
