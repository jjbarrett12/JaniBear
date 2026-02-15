import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ClientForm } from '@/components/crm/client-form';

export default async function NewClientPage() {
  const org = await requireOrg();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/crm/clients"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Client</h1>
          <p className="text-muted-foreground">Add a client to your CRM</p>
        </div>
      </div>

      <ClientForm orgId={org.org_id} />
    </div>
  );
}
