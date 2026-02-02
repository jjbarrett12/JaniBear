import { requireOrg } from '@/lib/auth';
import { AppSidebarNew } from '@/components/app/app-sidebar-new';
import { BottomNav } from '@/components/app/bottom-nav';
import { ThemeProvider } from '@/lib/theme-provider';
import { ThemeApplier } from '@/components/app/theme-applier';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from('organizations')
    .select('primary_color, secondary_color, logo_url, custom_branding')
    .eq('id', org.org_id)
    .single();

  return (
    <ThemeProvider orgId={org.org_id} initialTheme={organization || undefined}>
      <ThemeApplier />
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar for Desktop */}
        <div className="hidden lg:block w-64 fixed inset-y-0 z-50">
           <AppSidebarNew />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:pl-64 min-h-screen pb-20 lg:pb-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      </div>
    </ThemeProvider>
  );
}
