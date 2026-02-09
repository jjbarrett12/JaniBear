import { redirect } from 'next/navigation';
import { getUserContext, isOperator } from '@/lib/user-context';

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, context } = await getUserContext();
  if (!user) redirect('/auth/login');
  if (!context.activeOrgId) redirect('/onboarding');
  if (!isOperator(context)) redirect('/franchisor');
  return <>{children}</>;
}
