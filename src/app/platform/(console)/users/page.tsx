import { PageHeader } from '@/components/enterprise';
import { Card, CardContent } from '@/components/ui/card';

export default function PlatformUsersPage() {
  return (
    <>
      <PageHeader title="Users" description="Global user search. Memberships, last seen, roles." />
      <Card className="rounded-2xl border border-border bg-card shadow-sm mt-6">
        <CardContent className="p-6 text-sm text-muted-foreground">
          User search and detail drawer (memberships, disable user) — wire to user/org_members data.
        </CardContent>
      </Card>
    </>
  );
}
