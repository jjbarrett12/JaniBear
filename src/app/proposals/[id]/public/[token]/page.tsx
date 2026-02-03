import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AcceptProposalForm } from '@/components/proposals/accept-proposal-form';
import { CheckCircle2 } from 'lucide-react';

// Public route - no auth required
export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc('get_proposal_public', { token_input: token })
    .single();

  if (error || !data) {
    notFound();
  }

  const signedAt = data.client_signed_at as string | null | undefined;
  const signerName = data.client_signer_name as string | null | undefined;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        <header className="bg-primary text-primary-foreground p-6">
          <h1 className="text-2xl font-bold">
            Proposal for {data.client_name ?? 'Client'}
          </h1>
          <p className="opacity-80">{data.site_name ?? ''}</p>
        </header>

        <div className="p-8 space-y-8">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: data.proposal_html || '<p>Proposal content</p>',
            }}
          />
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold mb-4">Pricing Summary</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(data.pricing_json ?? {}, null, 2)}
              </pre>
            </div>
          </div>

          <div className="border-t pt-8">
            {signedAt ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800">
                      This proposal has been signed
                    </h3>
                    <p className="text-green-700 text-sm mt-1">
                      Signed by {signerName ?? 'Client'} on{' '}
                      {new Date(signedAt).toLocaleDateString(undefined, {
                        dateStyle: 'long',
                      })}
                    </p>
                    {data.client_signature_data && (
                      <div className="mt-4 p-3 bg-white rounded border border-green-100 inline-block">
                        <p className="text-xs text-slate-500 mb-2">Signature on file</p>
                        <img
                          src={data.client_signature_data as string}
                          alt="Signature"
                          className="h-16 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <AcceptProposalForm token={token} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
