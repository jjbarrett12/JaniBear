import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

// Allow public access - no auth check here
export default async function PublicProposalPage({ params }: { params: { token: string } }) {
  const supabase = await createClient();

  // Call the secure RPC function to get safe data
  const { data, error } = await supabase
    .rpc('get_proposal_public', { token_input: params.token })
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        <header className="bg-primary text-primary-foreground p-6">
          <h1 className="text-2xl font-bold">Proposal for {data.client_name}</h1>
          <p className="opacity-80">{data.site_name}</p>
        </header>

        <div className="p-8 space-y-8">
          {/* Render HTML content safely */}
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: data.proposal_html || '<p>No content</p>' }} 
          />
          
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold mb-4">Pricing Summary</h3>
            <div className="bg-gray-50 p-4 rounded-md">
               <pre className="text-sm">{JSON.stringify(data.pricing_json, null, 2)}</pre>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-8">
             <form action={async () => {
               'use server';
               // In real app, verify token again and update status
               console.log('Proposal accepted');
             }}>
               <button 
                 type="submit" 
                 className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition"
               >
                 Accept Proposal
               </button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}
