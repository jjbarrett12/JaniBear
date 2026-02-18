import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { AppSidebar } from '@/components/app/app-sidebar';
import { BottomNav } from '@/components/app/bottom-nav';
import { ThemeProvider } from '@/lib/theme-provider';
import { ThemeApplier } from '@/components/app/theme-applier';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  // Get organization branding (maybeSingle so layout never throws if RLS/row missing)
  const { data: organization } = await supabase
    .from('organizations')
    .select('primary_color, secondary_color, logo_url, custom_branding')
    .eq('id', org.org_id)
    .maybeSingle();

  return (
    <ThemeProvider orgId={org.org_id} initialTheme={organization ?? undefined}>
      <ThemeApplier />
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main className="lg:pl-56 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </ThemeProvider>
  );
}
