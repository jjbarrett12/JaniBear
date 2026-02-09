import { redirect } from 'next/navigation';
import { getUserContext, isFranchisor } from '@/lib/user-context';

export default async function FranchisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, context } = await getUserContext();
  if (!user) redirect('/auth/login');
  if (!context.activeOrgId) redirect('/onboarding');
  if (!isFranchisor(context)) redirect('/operator');
  return <>{children}</>;
}
