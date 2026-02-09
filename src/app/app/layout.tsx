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

  // Get organization branding
  const { data: organization } = await supabase
    .from('organizations')
    .select('primary_color, secondary_color, logo_url, custom_branding')
    .eq('id', org.org_id)
    .single();

  return (
    <ThemeProvider orgId={org.org_id} initialTheme={organization || undefined}>
      <ThemeApplier />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppSidebar />
        <main className="lg:pl-56 pt-20 lg:pt-0 pb-20 lg:pb-0">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </ThemeProvider>
  );
}
