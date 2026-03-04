import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrgMember, requireOrgPermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';

const UpdateOnboardingSchema = z.object({
  onboarding_status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  enabled_modules: z
    .object({
      sales: z.boolean().optional(),
      ops: z.boolean().optional(),
      management: z.boolean().optional(),
    })
    .optional(),
  default_role_template: z.string().max(100).optional(),
});

/**
 * GET /api/orgs/[orgId]/onboarding — Get onboarding state (any org member).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireOrgMember(orgId);
  if (!auth.ok) return auth.response;

  const { data: settings, error } = await auth.supabase
    .from('org_settings')
    .select('onboarding_status, enabled_modules, default_role_template, updated_at')
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    onboarding_status: settings?.onboarding_status ?? 'pending',
    enabled_modules: settings?.enabled_modules ?? { sales: true, ops: true, management: true },
    default_role_template: settings?.default_role_template ?? null,
    updated_at: settings?.updated_at ?? null,
  });
}

/**
 * PATCH /api/orgs/[orgId]/onboarding — Update onboarding state (org.manage_settings).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_SETTINGS);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.onboarding_status !== undefined) {
    updates.onboarding_status = parsed.data.onboarding_status;
  }
  if (parsed.data.enabled_modules !== undefined) {
    updates.enabled_modules = parsed.data.enabled_modules;
  }
  if (parsed.data.default_role_template !== undefined) {
    updates.default_role_template = parsed.data.default_role_template;
  }

  const { error } = await auth.supabase
    .from('org_settings')
    .upsert(
      { org_id: orgId, ...updates },
      { onConflict: 'org_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
