'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLead } from '@/actions/leads';
import { LeadImport, type LeadImportSource, type ParsedLead } from '@/components/sales/lead-import';
import { Card, CardContent } from '@/components/ui/card';
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
    try {
      const result = await createLead({
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
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/app/sales/leads/${result.leadId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save lead');
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-foreground">Import Lead</h1>
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
