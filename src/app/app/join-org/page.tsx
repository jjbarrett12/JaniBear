import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { acceptOrgInvite } from '@/actions/team';

export default async function JoinOrgPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = await getCurrentUser();

  if (!token) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>This invite link is missing a token. Ask your team admin to send you a new invite.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/app/join-org?token=${token}`)}`);
  }

  const result = await acceptOrgInvite(token);

  if (result.error) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Could not join organization</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect('/app/dashboard');
}
