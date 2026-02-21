import { requireOrg } from '@/lib/auth';
import { getClientDetail } from '@/actions/crm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ClientDetailTabs } from '@/components/crm/client-detail-tabs';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const data = await getClientDetail(org.org_id, id);

  if (!data.client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/crm">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{data.client.name}</h1>
          <p className="text-muted-foreground">
            {data.client.status ?? '—'} • {data.locations.length} site(s) • {data.opportunities.length} opportunity(ies)
          </p>
        </div>
      </div>

      <ClientDetailTabs
        clientId={id}
        orgId={org.org_id}
        client={data.client}
        locations={data.locations}
        contacts={data.contacts}
        opportunities={data.opportunities}
        recentActivities={data.recentActivities}
      />
    </div>
  );
}
