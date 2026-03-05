type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

type ServerEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

const isDev = process.env.NODE_ENV !== 'production';

function logFallbackOnce(message: string) {
  if (!isDev) return;
  const key = '__JANIBEAR_ENV_FALLBACK_LOGGED__';
  const g = globalThis as typeof globalThis & { [key: string]: boolean | undefined };
  if (g[key]) return;
  g[key] = true;
  console.warn(`[env] ${message}`);
}

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(value: string | undefined): string {
  return value?.trim() ?? '';
}

function resolveServerSupabaseUrl(): string {
  const direct = optional(process.env.SUPABASE_URL);
  if (direct) return direct;
  const fallback = optional(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (fallback) {
    logFallbackOnce('Using NEXT_PUBLIC_SUPABASE_URL as fallback for SUPABASE_URL.');
    return fallback;
  }
  return required('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL', undefined);
}

function resolveServerAnonKey(): string {
  const direct = optional(process.env.SUPABASE_ANON_KEY);
  if (direct) return direct;
  const fallback = optional(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (fallback) {
    logFallbackOnce('Using NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback for SUPABASE_ANON_KEY.');
    return fallback;
  }
  return required('SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY', undefined);
}

function resolvePublicSupabaseUrl(): string {
  const direct = optional(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (direct) return direct;
  const fallback = optional(process.env.SUPABASE_URL);
  if (fallback) {
    logFallbackOnce('Using SUPABASE_URL as fallback for NEXT_PUBLIC_SUPABASE_URL.');
    return fallback;
  }
  return required('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL', undefined);
}

function resolvePublicAnonKey(): string {
  const direct = optional(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (direct) return direct;
  const fallback = optional(process.env.SUPABASE_ANON_KEY);
  if (fallback) {
    logFallbackOnce('Using SUPABASE_ANON_KEY as fallback for NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    return fallback;
  }
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY', undefined);
}

export const publicEnv: PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: resolvePublicSupabaseUrl(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: resolvePublicAnonKey(),
};

export const serverEnv: ServerEnv = {
  SUPABASE_URL: resolveServerSupabaseUrl(),
  SUPABASE_ANON_KEY: resolveServerAnonKey(),
  SUPABASE_SERVICE_ROLE_KEY: optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
};
