import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';
import { requireOrgSeatAdmin } from '@/lib/billing/requireOrgRole';

const AssignSchema = z.object({
  org_id: z.string().uuid(),
  token_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

/**
 * POST /api/org/tokens/assign — Assign an available token to a user.
 * Sets org_members.role to the token's plan. Enforces at most one token per user (DB partial unique).
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = AssignSchema.safeParse(body);
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
  const { org_id, token_id, user_id } = parsed.data;

  const { data: token, error: tokenErr } = await supabase
    .from('org_seat_tokens')
    .select('id, plan, status')
    .eq('id', token_id)
    .eq('org_id', org_id)
    .single();
  if (tokenErr || !token || token.status !== 'available') {
    return NextResponse.json({ error: 'Token not found or not available' }, { status: 400 });
  }

  // Ensure user is (or will be) a member — add as member if not present
  const { data: existingMember } = await supabase
    .from('org_members')
    .select('id')
    .eq('org_id', org_id)
    .eq('user_id', user_id)
    .maybeSingle();
  if (!existingMember) {
    const { error: insertErr } = await supabase.from('org_members').insert({
      org_id,
      user_id,
      role: token.plan,
      status: 'active',
    });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  } else {
    await supabase
      .from('org_members')
      .update({ role: token.plan })
      .eq('org_id', org_id)
      .eq('user_id', user_id);
  }

  const { error: updateErr } = await supabase
    .from('org_seat_tokens')
    .update({
      assigned_to_user_id: user_id,
      assigned_by_user_id: auth.userId,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    })
    .eq('id', token_id)
    .eq('org_id', org_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token_id, plan: token.plan });
}
