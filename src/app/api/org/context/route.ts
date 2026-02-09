import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/user-context';

/**
 * GET /api/org/context
 * Returns current user context (active org, org type, role, modules, capabilities).
 * Use for client-side gating (hasModule, hasCap, isOperator, isFranchisor) without duplicating logic.
 */
export async function GET() {
  const { user, context } = await getUserContext();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    context: {
      userId: context.userId,
      activeOrgId: context.activeOrgId,
      orgType: context.orgType,
      effectiveRole: context.effectiveRole,
      planCode: context.planCode,
      modules: context.modules,
      capabilities: context.capabilities,
    },
  });
}
