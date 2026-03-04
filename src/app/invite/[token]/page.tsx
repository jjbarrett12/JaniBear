import { redirect } from 'next/navigation';

/**
 * Token-based invite acceptance: /invite/[token]
 * Redirects to the app join flow so the user signs in (if needed) and accepts the invite.
 */
export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token?.trim()) {
    redirect('/auth/login');
  }
  redirect(`/app/join-org?token=${encodeURIComponent(token.trim())}`);
}
