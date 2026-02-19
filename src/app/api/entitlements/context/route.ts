import { NextResponse } from 'next/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';

/**
 * GET /api/entitlements/context
 * Returns current user's effective features (and plan/addons) for the active org.
 * Use from client when you cannot pass server-resolved `allowed` into FeatureGate.
 */
export async function GET() {
  const access = await getEffectiveAccessForCurrentUser();
  if (!access) {
    return NextResponse.json({ error: 'Not authenticated or no organization' }, { status: 401 });
  }
  return NextResponse.json({
    effectiveFeatures: access.effectiveFeatures,
    plan: access.plan,
    enabledAddons: access.enabledAddons,
    role: access.role,
  });
}
