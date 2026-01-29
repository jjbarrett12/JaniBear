'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

interface TemplateItem {
  id: string;
  label: string;
  item_type: 'pass_fail' | 'rating_1_5' | 'numeric' | 'text' | 'yes_no' | 'task_checklist';
  weight: number;
  is_required: boolean;
  instructions?: string;
  sort_order: number;
}

interface TemplateSection {
  id: string;
  title: string;
  sort_order: number;
  template_items: TemplateItem[];
}

interface InspectionRunnerProps {
  location: any;
  template: any;
  sections: TemplateSection[];
  scheduleId?: string;
  scheduledDate?: string;
}

export function InspectionRunner({
  location,
  template,
  sections,
  scheduleId,
  scheduledDate,
}: InspectionRunnerProps) {
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Silently fail if geolocation is denied
        }
      );
    }

    // Create inspection record
    async function createInspection() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) return;

      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert({
          org_id: membership.org_id,
          location_id: location.id,
          template_id: template.id,
          schedule_id: scheduleId || null,
          inspector_user_id: user.id,
          lat: geoLocation?.lat || null,
          lng: geoLocation?.lng || null,
        })
        .select()
        .single();

      if (!error && inspection) {
        setInspectionId(inspection.id);
      }
    }

    createInspection();
  }, []);

  const updateResponse = (itemId: string, value: any) => {
    setResponses({ ...responses, [itemId]: value });
  };

  const handlePhotoUpload = async (itemId: string, file: File) => {
    if (!inspectionId) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${membership.org_id}/${inspectionId}/${itemId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(fileName);

      setPhotos({
        ...photos,
        [itemId]: [...(photos[itemId] || []), publicUrl],
      });
    }
  };

  const calculateScore = (item: TemplateItem, value: any): number | null => {
    if (value === null || value === undefined) return null;

    switch (item.item_type) {
      case 'pass_fail':
        return value === 'pass' ? 100 * item.weight : 0;
      case 'yes_no':
        return value === 'yes' ? 100 * item.weight : 0;
      case 'rating_1_5':
        const ratingMap: Record<number, number> = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
        return (ratingMap[value] || 0) * item.weight;
      case 'numeric':
      case 'text':
      case 'task_checklist':
        return null; // No automatic scoring
      default:
        return null;
    }
  };

  const handleComplete = async () => {
    if (!inspectionId) return;

    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      setIsLoading(false);
      return;
    }

    try {
      // Calculate scores for each section
      const sectionScores: Record<string, { total: number; weighted: number }> = {};

      for (const section of sections) {
        let totalWeight = 0;
        let totalScore = 0;

        for (const item of section.template_items) {
          const response = responses[item.id];
          const score = calculateScore(item, response);
          
          if (score !== null) {
            totalScore += score;
            totalWeight += item.weight;
          }

          // Save response
          await supabase.from('inspection_responses').insert({
            org_id: membership.org_id,
            inspection_id: inspectionId,
            template_item_id: item.id,
            value_json: response !== undefined ? { value: response } : null,
            score,
            notes: notes[item.id] || null,
          });

          // Save photos
          if (photos[item.id]) {
            for (const photoUrl of photos[item.id]) {
              await supabase.from('inspection_photos').insert({
                org_id: membership.org_id,
                inspection_id: inspectionId,
                template_item_id: item.id,
                storage_path: photoUrl,
              });
            }
          }
        }

        if (totalWeight > 0) {
          const sectionScore = totalScore / totalWeight;
          sectionScores[section.id] = { total: sectionScore, weighted: totalWeight };

          await supabase.from('inspection_section_scores').insert({
            org_id: membership.org_id,
            inspection_id: inspectionId,
            template_section_id: section.id,
            score: sectionScore,
          });
        }
      }

      // Calculate total score
      let totalWeightedScore = 0;
      let totalWeight = 0;
      for (const score of Object.values(sectionScores)) {
        totalWeightedScore += score.total * score.weighted;
        totalWeight += score.weighted;
      }
      const totalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : null;

      // Update inspection
      await supabase
        .from('inspections')
        .update({
          completed_at: new Date().toISOString(),
          total_score: totalScore,
        })
        .eq('id', inspectionId);

      router.push(`/app/inspections/${inspectionId}`);
      router.refresh();
    } catch (err: any) {
      console.error('Error completing inspection:', err);
      alert('Failed to complete inspection: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSection = sections[currentSectionIndex];
  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  if (!currentSection) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{location.name}</h1>
          <span className="text-sm text-gray-500">
            Section {currentSectionIndex + 1} of {sections.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentSection.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSection.template_items.map((item) => (
            <div key={item.id} className="space-y-3 border-b pb-6 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium">
                    {item.label}
                    {item.is_required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {item.instructions && (
                    <p className="text-sm text-gray-500 mt-1">{item.instructions}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {item.item_type === 'pass_fail' && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={responses[item.id] === 'pass' ? 'default' : 'outline'}
                      onClick={() => updateResponse(item.id, 'pass')}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Pass
                    </Button>
                    <Button
                      type="button"
                      variant={responses[item.id] === 'fail' ? 'destructive' : 'outline'}
                      onClick={() => updateResponse(item.id, 'fail')}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Fail
                    </Button>
                  </div>
                )}

                {item.item_type === 'yes_no' && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={responses[item.id] === 'yes' ? 'default' : 'outline'}
                      onClick={() => updateResponse(item.id, 'yes')}
                      className="flex-1"
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={responses[item.id] === 'no' ? 'outline' : 'default'}
                      onClick={() => updateResponse(item.id, 'no')}
                      className="flex-1"
                    >
                      No
                    </Button>
                  </div>
                )}

                {item.item_type === 'rating_1_5' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant={responses[item.id] === rating ? 'default' : 'outline'}
                        onClick={() => updateResponse(item.id, rating)}
                        className="flex-1"
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                )}

                {(item.item_type === 'numeric' || item.item_type === 'text') && (
                  <Input
                    type={item.item_type === 'numeric' ? 'number' : 'text'}
                    value={responses[item.id] || ''}
                    onChange={(e) => updateResponse(item.id, e.target.value)}
                    placeholder="Enter value"
                  />
                )}

                {item.item_type === 'task_checklist' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={responses[item.id] === true}
                      onChange={(e) => updateResponse(item.id, e.target.checked)}
                      className="rounded"
                    />
                    <Label>Completed</Label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm">Notes (optional)</Label>
                  <Textarea
                    value={notes[item.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                    rows={2}
                    placeholder="Add notes..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Photos</Label>
                  <div className="flex gap-2 flex-wrap">
                    {photos[item.id]?.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-24 border rounded">
                        <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover rounded" />
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(item.id, file);
                        }}
                      />
                      <Camera className="h-6 w-6 text-gray-400" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
          disabled={currentSectionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {currentSectionIndex < sections.length - 1 ? (
          <Button
            onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? 'Completing...' : 'Complete Inspection'}
          </Button>
        )}
      </div>
    </div>
  );
}
