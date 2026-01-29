import { NextResponse } from 'next/server';

/**
 * GET /api/health - Always returns 200 if the app is running.
 * Use this to verify the deployment is live and env is set (no secrets in response).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    env: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
