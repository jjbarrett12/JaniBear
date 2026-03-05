import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceDashboardUrl } from '@/lib/workspace/org-resolver';
import { Button } from '@/components/ui/button';
import { LauncherClient } from './launcher-client';

/**
 * Lists orgs the user belongs to; opens workspace dashboard URL.
 * 0 orgs → /onboarding; 1 org → "Opening workspace…" then redirect; many → list.
 * Defensive: never throw — redirect on failure so /launcher never 404s.
 */
export default async function LauncherPage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login?next=/launcher');

    const { data: memberships } = await supabase
      .from('org_members')
      .select('org_id, organizations ( id, name, slug, logo_url )')
      .eq('user_id', user.id)
      .or('status.eq.active,status.is.null');

    const orgIds = (memberships ?? [])
      .map((m: { org_id: string }) => m.org_id)
      .filter(Boolean);
    const { data: settingsRows } = orgIds.length > 0
      ? await supabase.from('org_settings').select('org_id, display_name, logo_url').in('org_id', orgIds)
      : { data: [] as { org_id: string; display_name: string | null; logo_url: string | null }[] };

    const settingsByOrg = (settingsRows ?? []).reduce<Record<string, { display_name?: string; logo_url?: string | null }>>((acc, row) => {
      acc[row.org_id] = {
        display_name: row.display_name?.trim() || undefined,
        logo_url: row.logo_url ?? undefined,
      };
      return acc;
    }, {});

    const orgs = (memberships ?? [])
      .filter((m: { organizations: { slug: string } | null }) => (m.organizations as { slug?: string } | null)?.slug)
      .map((m: { org_id: string; organizations: { name: string; slug: string; logo_url?: string | null } | null }) => {
        const org = m.organizations!;
        const settings = settingsByOrg[m.org_id];
        const displayName = (settings?.display_name && settings.display_name.trim()) ? settings.display_name.trim() : org.name;
        const logoUrl = (settings?.logo_url && settings.logo_url.trim()) ? settings.logo_url : org.logo_url;
        return {
          slug: org.slug,
          name: displayName,
          logoUrl: logoUrl ?? null,
          url: getWorkspaceDashboardUrl(org.slug),
        };
      });

    if (orgs.length === 0) redirect('/onboarding');
    if (orgs.length === 1) {
      return (
        <LauncherClient
          singleOrgUrl={orgs[0].url}
          orgName={orgs[0].name}
        />
      );
    }

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block [&>span]:block [&>span]:relative">
              <Image src="/logo.png" alt="JANIBEAR" width={200} height={66} className="h-10 w-auto mx-auto" unoptimized />
            </Link>
            <h1 className="mt-6 text-xl font-semibold tracking-tight">Open workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose an organization to continue</p>
          </div>
          <ul className="space-y-3">
            {orgs.map((org) => (
              <li key={org.slug}>
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-auto py-4 px-4 justify-start gap-3"
                >
                  <a href={org.url}>
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-muted" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                        {org.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium">{org.name}</span>
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } catch {
    redirect('/auth/login?next=/launcher');
  }
}
