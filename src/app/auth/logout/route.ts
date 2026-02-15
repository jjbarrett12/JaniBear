import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Stay on same origin so redirect is consistent (avoids www vs non-www issues)
  const baseUrl = requestUrl.origin || process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Still redirect so user can get unstuck
  }

  return NextResponse.redirect(new URL('/auth/login', baseUrl));
}
