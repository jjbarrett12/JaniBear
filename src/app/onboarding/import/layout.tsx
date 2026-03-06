import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STEPS = [
  { path: '/onboarding/import/upload', label: 'Upload' },
  { path: '/onboarding/import/review', label: 'Review' },
  { path: '/onboarding/import/confirm', label: 'Confirm' },
  { path: '/onboarding/import/done', label: 'Done' },
];

export default async function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = await getActiveOrgIdFromCookie();

  if (!user) redirect('/auth/login?next=/onboarding/import');
  if (!orgId) redirect('/auth/set-org-and-continue?next=/onboarding/import');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/app/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="flex items-center gap-1 text-sm" aria-label="Import progress">
          {STEPS.map((step, i) => (
            <span key={step.path} className="flex items-center gap-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200/80 text-xs font-medium text-slate-600">
                {i + 1}
              </span>
              <Link
                href={step.path}
                className="rounded-md px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {step.label}
              </Link>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />}
            </span>
          ))}
        </nav>
        <main className="mt-10">{children}</main>
      </div>
    </div>
  );
}
