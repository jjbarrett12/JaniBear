'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LeadImport, type LeadImportSource, type ParsedLead } from '@/components/sales/lead-import';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewLeadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (source: LeadImportSource, data: ParsedLead) => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not signed in.');
      setIsLoading(false);
      return;
    }
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    if (!membership?.org_id) {
      setError('Organization not found.');
      setIsLoading(false);
      return;
    }
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        org_id: membership.org_id,
        source,
        contact_name: data.contact_name ?? null,
        company: data.company ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        zip: data.zip ?? null,
        raw_text: data.raw_text ?? null,
        status: 'new',
        created_by_user_id: user.id,
      })
      .select('id')
      .single();
    setIsLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (lead?.id) router.push(`/app/sales/leads/${lead.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/sales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Lead</h1>
          <p className="text-gray-600 mt-1">Add a lead via paste, email, voice, scan, or 3rd party</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700">{error}</CardContent>
        </Card>
      )}

      <LeadImport onImport={handleImport} isLoading={isLoading} />
    </div>
  );
}
