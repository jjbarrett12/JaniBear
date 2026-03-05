import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';
import { computeMonthlyTotalCents, type LidarTier } from '@/lib/billing/pricing';

const PreviewSchema = z.object({
  cub_count: z.number().int().min(0).default(0),
  super_cub_count: z.number().int().min(0).default(0),
  grizzly_count: z.number().int().min(0).default(0),
  super_grizzly_count: z.number().int().min(0).default(0),
  kodiak_count: z.number().int().min(0).default(0),
  super_kodiak_count: z.number().int().min(0).default(0),
  lidar_tier: z.enum(['none', 'starter', 'unlimited']).default('none'),
});

/**
 * POST /api/org/seats/preview-total — Live price breakdown + total monthly (cents).
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const monthly_total_cents = computeMonthlyTotalCents({
    ...parsed.data,
    lidar_tier: parsed.data.lidar_tier as LidarTier,
  });

  return NextResponse.json({
    monthly_total_cents,
    ...parsed.data,
  });
}
