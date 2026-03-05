import { NextRequest, NextResponse } from 'next/server';
import { getUserOrNull } from '@/lib/supabase/server';
import { publicEnv, serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

type WhoAmIResponse = {
  host: string | null;
  forwardedProto: string | null;
  hasSbCookies: boolean;
  sbCookieCount: number;
  sbCookieNames: string[];
  hasSession: boolean;
  userId: string | null;
  userError: string | null;
  envPrefixes: {
    serverUrlPrefix: string;
    publicUrlPrefix: string;
    anonKeyPrefix: string;
  };
};

function maskPrefix(value: string, visible = 10): string {
  if (!value) return '';
  return value.slice(0, visible);
}

function getCookieNames(request: NextRequest): string[] {
  const fromStore = request.cookies.getAll().map((c) => c.name);
  if (fromStore.length > 0) return fromStore;
  const raw = request.headers.get('cookie');
  if (!raw?.trim()) return [];
  return raw
    .split(';')
    .map((part) => part.trim().split('=')[0]?.trim() ?? '')
    .filter((name) => name.length > 0);
}

export async function GET(request: NextRequest) {
  const cookieNames = getCookieNames(request);
  const sbCookieNames = cookieNames.filter((name) => name.startsWith('sb-'));

  let userId: string | null = null;
  let userError: string | null = null;
  try {
    const user = await getUserOrNull({ request });
    userId = user?.id ?? null;
  } catch (error) {
    userError = error instanceof Error ? error.message : 'unknown_error';
  }

  const payload: WhoAmIResponse = {
    host: request.headers.get('host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    hasSbCookies: sbCookieNames.length > 0,
    sbCookieCount: sbCookieNames.length,
    sbCookieNames,
    hasSession: !!userId,
    userId,
    userError,
    envPrefixes: {
      serverUrlPrefix: maskPrefix(serverEnv.SUPABASE_URL),
      publicUrlPrefix: maskPrefix(publicEnv.NEXT_PUBLIC_SUPABASE_URL),
      anonKeyPrefix: maskPrefix(serverEnv.SUPABASE_ANON_KEY),
    },
  };

  return NextResponse.json(payload);
}
