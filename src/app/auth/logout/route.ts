import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const baseUrl = requestUrl.origin;
  const loginUrl = new URL('/auth/login', baseUrl);

  const response = NextResponse.redirect(loginUrl);
  const supabase = await supabaseServer({ request, response });

  try {
    await supabase.auth.signOut();
  } catch {
    // Still clear cookies and redirect so user can get unstuck
  }

  // Clear org cookie so next login gets a clean state
  response.cookies.set('active_org_id', '', { path: '/', maxAge: 0 });
  return response;
}
