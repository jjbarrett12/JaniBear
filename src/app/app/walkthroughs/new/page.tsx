import { requireOrg, getCurrentUser } from '@/lib/auth';
import { WalkthroughForm } from '@/components/walkthroughs/walkthrough-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'New Walkthrough | JANIBEAR',
};

type PageProps = { searchParams: Promise<{ leadId?: string }> };

export default async function NewWalkthroughPage({ searchParams }: PageProps) {
  const org = await requireOrg();
  const user = await getCurrentUser();
  const params = await searchParams;
  const leadId = params.leadId;

  if (!user) {
    return null;
  }

  let initialLead: { companyName: string; contactName: string; contactEmail: string; contactPhone: string; siteAddress: string; siteCity: string; siteState: string; siteZip: string } | undefined;
  if (leadId) {
    const supabase = await createClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('company, contact_name, email, phone, address, city, state, zip')
      .eq('id', leadId)
      .eq('org_id', org.org_id)
      .single();
    if (lead) {
      initialLead = {
        companyName: (lead.company ?? '').trim(),
        contactName: (lead.contact_name ?? '').trim(),
        contactEmail: (lead.email ?? '').trim(),
        contactPhone: (lead.phone ?? '').trim(),
        siteAddress: (lead.address ?? '').trim(),
        siteCity: (lead.city ?? '').trim(),
        siteState: (lead.state ?? '').trim(),
        siteZip: (lead.zip ?? '').trim(),
      };
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={leadId ? `/app/sales/leads/${leadId}` : '/app/walkthroughs'} 
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Walkthrough</h1>
          <p className="text-gray-500">
            {initialLead ? 'Pre-filled from lead. Capture site and schedule.' : 'Capture all the details needed to generate a proposal'}
          </p>
        </div>
      </div>

      <WalkthroughForm 
        orgId={org.org_id} 
        userId={user.id}
        userName={user.user_metadata?.full_name}
        initialLead={initialLead}
      />
    </div>
  );
}
