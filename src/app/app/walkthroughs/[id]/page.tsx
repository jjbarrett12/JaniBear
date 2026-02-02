import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from 'next/navigation';
import { updateWalkthroughStatus } from '@/actions/walkthroughs';

export default async function WalkthroughDetailPage({ params }: { params: { id: string } }) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: walkthrough } = await supabase
    .from('walkthroughs')
    .select(`
      *,
      sites (*),
      opportunities (*, clients(*)),
      walkthrough_media (*)
    `)
    .eq('id', params.id)
    .single();

  if (!walkthrough) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walkthrough Details</h1>
          <p className="text-gray-600">{walkthrough.sites?.name} - {walkthrough.opportunities?.clients?.name}</p>
        </div>
        <div className="flex gap-2">
          {walkthrough.status !== 'completed' && (
            <form action={updateWalkthroughStatus.bind(null, walkthrough.id, 'completed')}>
               <Button type="submit">Complete Walkthrough</Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Media Capture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
              Upload Photos/Videos/Audio here
              <br />
              (Storage Stub)
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {walkthrough.walkthrough_media?.map((media: { id: string; type: string }) => (
                <div key={media.id} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                  {media.type}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scope & Transcription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 bg-gray-50 rounded-md">
               <h3 className="font-medium mb-2">Transcript</h3>
               <p className="text-sm text-gray-600">
                 No transcript available yet.
               </p>
             </div>
             <div className="p-4 bg-gray-50 rounded-md">
               <h3 className="font-medium mb-2">Extracted Scope</h3>
               <p className="text-sm text-gray-600">
                 No scope extracted yet.
               </p>
             </div>
             <Button variant="outline" className="w-full">
               Generate Proposal
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
