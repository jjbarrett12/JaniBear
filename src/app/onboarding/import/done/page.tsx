import { ImportDoneClient } from '@/components/onboarding-import/ImportDoneClient';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ImportDonePage({
  searchParams,
}: {
  searchParams: Promise<{
    batchId?: string;
    accountsCreated?: string;
    facilitiesCreated?: string;
    crewsCreated?: string;
    accountsSkipped?: string;
    facilitiesSkipped?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      {/* Header — success moment */}
      <header className="text-center space-y-4">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600" aria-hidden>
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Your JANIBEAR System Is Ready
          </h1>
          <p className="text-slate-600 text-base">
            Your business has been successfully imported.
          </p>
        </div>
      </header>

      <ImportDoneClient
        batchId={params.batchId ?? ''}
        accountsCreated={params.accountsCreated ? parseInt(params.accountsCreated, 10) : 0}
        facilitiesCreated={params.facilitiesCreated ? parseInt(params.facilitiesCreated, 10) : 0}
        crewsCreated={params.crewsCreated ? parseInt(params.crewsCreated, 10) : 0}
        accountsSkipped={params.accountsSkipped ? parseInt(params.accountsSkipped, 10) : 0}
        facilitiesSkipped={params.facilitiesSkipped ? parseInt(params.facilitiesSkipped, 10) : 0}
      />
    </div>
  );
}
