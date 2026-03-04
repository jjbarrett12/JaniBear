import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/enterprise';
import { PlatformCreateOrgForm } from '@/components/platform/platform-create-org-form';

export default function PlatformOrgNewPage() {
  return (
    <>
      <PageHeader
        title="Create Org"
        description="Add a new organization. Optionally set plan and trial length."
      />
      <Card className="rounded-2xl border border-border bg-card shadow-sm mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">New organization</CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformCreateOrgForm />
        </CardContent>
      </Card>
    </>
  );
}
