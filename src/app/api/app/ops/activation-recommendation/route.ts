/**
 * GET /api/app/ops/activation-recommendation
 * Query: activation_type, entity_type, entity_id, force_compute=1
 * Returns AI + scoring recommendation for crew assignment (primary, secondary, backup, reasoning, confidence, risk).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';
import { computeActivationRecommendation, getActivationRecommendation } from '@/lib/assignment-engine/recommendation';
import type { ActivationType, ActivationEntityType } from '@/types/activation-recommendation';

export const dynamic = 'force-dynamic';

const ACTIVATION_TYPES: ActivationType[] = ['new_account', 'crew_change', 'recovery', 'expansion', 'restart'];
const ENTITY_TYPES: ActivationEntityType[] = ['launch_packet', 'crew_change_request', 'account', 'facility'];

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const { searchParams } = new URL(request.url);
    const activation_type = searchParams.get('activation_type') as ActivationType | null;
    const entity_type = searchParams.get('entity_type') as ActivationEntityType | null;
    const entity_id = searchParams.get('entity_id');
    const force_compute = searchParams.get('force_compute') === '1';

    if (!entity_type || !ENTITY_TYPES.includes(entity_type) || !entity_id) {
      return NextResponse.json(
        { error: 'Missing or invalid entity_type or entity_id' },
        { status: 400 }
      );
    }
    const actType = activation_type ?? 'new_account';
    if (!ACTIVATION_TYPES.includes(actType)) {
      return NextResponse.json({ error: 'Invalid activation_type' }, { status: 400 });
    }

    if (force_compute) {
      const result = await computeActivationRecommendation({
        org_id: orgId,
        activation_type: actType,
        entity_type,
        entity_id,
        persist: true,
      });
      return NextResponse.json(result);
    }

    const stored = await getActivationRecommendation(orgId, entity_type, entity_id);
    if (stored) return NextResponse.json(stored);

    const result = await computeActivationRecommendation({
      org_id: orgId,
      activation_type: actType,
      entity_type,
      entity_id,
      persist: true,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get recommendation';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
