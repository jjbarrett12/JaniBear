import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileUp, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function ContractsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: contracts } = await supabase
    .from('service_contracts')
    .select('*, locations(name)')
    .eq('org_id', org.org_id)
    .order('uploaded_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Contracts</h1>
          <p className="text-gray-600 mt-1">Manage uploaded contracts and schedules</p>
        </div>
        <Link href="/app/contracts/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Contract
          </Button>
        </Link>
      </div>

      {contracts && contracts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract: any) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{contract.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {contract.locations && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {contract.locations.name}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {formatDate(contract.uploaded_at)}
                </div>
                <a
                  href={contract.storage_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block"
                >
                  <Button variant="outline" size="sm">
                    View Document
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No contracts uploaded yet</p>
            <Link href="/app/contracts/upload">
              <Button>Upload Your First Contract</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
