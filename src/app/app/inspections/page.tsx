import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardCheck, MapPin, Calendar } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default async function InspectionsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: inspections } = await supabase
    .from('inspections')
    .select('*, locations(name), templates(name), profiles(full_name)')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inspections</h1>
          <p className="text-muted-foreground mt-1">View and manage inspections</p>
        </div>
        <Link href="/app/inspections/start">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </Link>
      </div>

      {inspections && inspections.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inspections.map((inspection: any) => (
                <Link
                  key={inspection.id}
                  href={`/app/inspections/${inspection.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{inspection.locations?.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {inspection.templates?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Inspector: {inspection.profiles?.full_name || 'Unknown'} • {formatDateTime(inspection.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      {inspection.total_score !== null ? (
                        <div className="text-lg font-semibold">
                          {inspection.total_score.toFixed(1)}%
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No inspections yet</p>
            <Link href="/app/inspections/start">
              <Button>Start Your First Inspection</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
