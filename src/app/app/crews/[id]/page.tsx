import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CrewForm } from '@/components/crews/crew-form';

export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: crew } = await supabase
    .from('crews')
    .select('id, name')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!crew) {
    notFound();
  }

  const { data: members } = await supabase
    .from('crew_members')
    .select('user_id, role')
    .eq('crew_id', id)
    .order('role');

  const initialData = {
    id: crew.id,
    name: crew.name,
    members: (members ?? []).map((m) => ({ user_id: m.user_id, role: m.role })),
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/app/crews">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Crew</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Update crew details and add or remove members</p>
        </div>
      </div>
      <CrewForm initialData={initialData} />
    </div>
  );
}
