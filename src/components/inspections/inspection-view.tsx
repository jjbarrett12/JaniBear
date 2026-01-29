'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ShareReportButton } from '@/components/reports/share-report-button';

interface InspectionViewProps {
  inspection: any;
  sections: any[];
  sectionScores: any[];
}

export function InspectionView({ inspection, sections, sectionScores }: InspectionViewProps) {
  const router = useRouter();
  const [isCreatingIssues, setIsCreatingIssues] = useState(false);

  const failedItems = sections.flatMap((section) =>
    section.template_items
      .filter((item: any) => {
        const response = item.inspection_responses?.[0];
        if (!response) return false;
        const value = response.value_json?.value;
        return (
          (item.item_type === 'pass_fail' && value === 'fail') ||
          (item.item_type === 'yes_no' && value === 'no') ||
          (item.item_type === 'rating_1_5' && value <= 2)
        );
      })
      .map((item: any) => ({ ...item, section }))
  );

  const handleCreateIssues = async () => {
    setIsCreatingIssues(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsCreatingIssues(false);
      return;
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      setIsCreatingIssues(false);
      return;
    }

    try {
      for (const item of failedItems) {
        const response = item.inspection_responses?.[0];
        if (!response) continue;

        await supabase.from('issues').insert({
          org_id: membership.org_id,
          location_id: inspection.location_id,
          inspection_id: inspection.id,
          inspection_response_id: response.id,
          title: `Issue: ${item.label}`,
          description: response.notes || `Failed item: ${item.label}`,
          severity: 'med',
          status: 'open',
        });
      }

      router.push(`/app/issues?inspection=${inspection.id}`);
      router.refresh();
    } catch (err: any) {
      alert('Failed to create issues: ' + err.message);
    } finally {
      setIsCreatingIssues(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/inspections">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{inspection.locations?.name}</h1>
            <p className="text-gray-600 mt-1">
              {inspection.templates?.name} • {formatDateTime(inspection.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {failedItems.length > 0 && (
            <Button onClick={handleCreateIssues} disabled={isCreatingIssues} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Create {failedItems.length} Issue{failedItems.length !== 1 ? 's' : ''}
            </Button>
          )}
          <ShareReportButton inspectionId={inspection.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inspection Summary</CardTitle>
            {inspection.total_score !== null && (
              <div className="text-3xl font-bold text-primary">
                {inspection.total_score.toFixed(1)}%
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Inspector:</span>
              <span className="ml-2 font-medium">{inspection.profiles?.full_name || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-500">Completed:</span>
              <span className="ml-2 font-medium">
                {inspection.completed_at ? formatDateTime(inspection.completed_at) : 'In Progress'}
              </span>
            </div>
            {inspection.lat && inspection.lng && (
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2 font-medium">
                  {inspection.lat.toFixed(4)}, {inspection.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {sections.map((section) => {
        const sectionScore = sectionScores.find((s) => s.template_section_id === section.id);
        return (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{section.title}</CardTitle>
                {sectionScore && (
                  <span className="text-lg font-semibold">{sectionScore.score.toFixed(1)}%</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.template_items.map((item: any) => {
                const response = item.inspection_responses?.[0];
                const value = response?.value_json?.value;
                const isFailed = 
                  (item.item_type === 'pass_fail' && value === 'fail') ||
                  (item.item_type === 'yes_no' && value === 'no') ||
                  (item.item_type === 'rating_1_5' && value <= 2);

                return (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg ${isFailed ? 'border-destructive bg-destructive/5' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.label}</h4>
                        {response?.notes && (
                          <p className="text-sm text-gray-600 mt-1">{response.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {value !== null && value !== undefined && (
                          <span className="text-sm font-medium">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </span>
                        )}
                        {response?.score !== null && (
                          <div className="text-xs text-gray-500">
                            Score: {response.score.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.inspection_photos && item.inspection_photos.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {item.inspection_photos.map((photo: any, idx: number) => (
                          <div key={idx} className="relative w-24 h-24 border rounded">
                            <Image
                              src={photo.storage_path}
                              alt={`Photo ${idx + 1}`}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
