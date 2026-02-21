'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/platform-guard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ShellKey } from '@/lib/shell';
import { SHELL_LABELS } from '@/lib/shell';

const IMPERSONATE_COOKIE = 'impersonate_org_id';

const VALID_SHELLS: ShellKey[] = ['owner_operator', 'franchisee', 'franchisor'];

export async function createOrg(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  await requirePlatformAdmin();
  const name = formData.get('name') as string;
  if (!name?.trim()) return { error: 'Name is required' };
  const shellRaw = formData.get('shell') as string;
  const shell: ShellKey = VALID_SHELLS.includes(shellRaw as ShellKey) ? (shellRaw as ShellKey) : 'owner_operator';

  const supabase = await createClient();
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({ name: name.trim(), status: 'trialing', shell })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/platform/orgs');
  revalidatePath('/platform/overview');
  redirect(`/platform/orgs/${org.id}`);
}

/** Set impersonation cookie and redirect to app. Platform admin only. */
export async function setImpersonateOrg(orgId: string) {
  await requirePlatformAdmin();
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  revalidatePath('/', 'layout');
  redirect('/app/dashboard');
}

/** Clear impersonation cookie and redirect to platform. */
export async function clearImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
  revalidatePath('/', 'layout');
  redirect('/platform/overview');
}

export async function getImpersonateOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
}

/** Set org shell (dashboard experience). Platform admin only. */
export async function setOrgShell(orgId: string, shell: ShellKey): Promise<{ error?: string; label?: string }> {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ shell })
    .eq('id', orgId);
  if (error) return { error: error.message };
  revalidatePath('/platform/orgs');
  revalidatePath(`/platform/orgs/${orgId}`);
  revalidatePath('/', 'layout');
  return { label: SHELL_LABELS[shell] };
}
