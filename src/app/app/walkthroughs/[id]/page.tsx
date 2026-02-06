import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Calendar, 
  User, 
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { updateWalkthroughStatus } from '@/actions/walkthroughs';
import { formatCurrency } from '@/lib/utils';

export default async function WalkthroughDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Fetch walkthrough with org_id filter for security
  const { data: walkthrough } = await supabase
    .from('walkthroughs')
    .select(`
      *,
      sites:locations (*),
      opportunities (
        *,
        clients (*)
      ),
      walkthrough_media (*)
    `)
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!walkthrough) notFound();

  // Fetch scope model if exists
  const { data: scopeModel } = await supabase
    .from('scope_models')
    .select('*')
    .eq('walkthrough_id', id)
    .eq('org_id', org.org_id)
    .single();

  // Fetch transcript if exists
  const { data: transcript } = await supabase
    .from('walkthrough_transcripts')
    .select('*')
    .eq('walkthrough_id', id)
    .eq('org_id', org.org_id)
    .single();

  const scope = scopeModel?.extracted_json as {
    site?: {
      name?: string;
      address?: string;
      square_footage?: number;
      flooring?: { hard_surface?: number; carpet?: number; tile?: number };
      restroom_count?: number;
    };
    service?: {
      days_per_week?: number;
      time_of_day?: string;
      special_requirements?: string;
    };
    pricing?: {
      hourly_rate?: number;
      estimated_crew_size?: number;
      estimated_hours?: number;
    };
    customer?: {
      company_name?: string;
      contact_name?: string;
      contact_email?: string;
      contact_phone?: string;
    };
    salesperson?: {
      name?: string;
    };
  } | null;

  // Calculate monthly estimate if scope exists
  const monthlyEstimate = scope?.pricing ? 
    (scope.pricing.hourly_rate || 25) * 
    (scope.pricing.estimated_crew_size || 2) * 
    (scope.pricing.estimated_hours || 2) * 
    (scope.service?.days_per_week || 5) * 4.33 
    : null;

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/app/walkthroughs" 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {scope?.customer?.company_name || walkthrough.opportunities?.clients?.name || 'Walkthrough Details'}
              </h1>
              <Badge className={statusColors[walkthrough.status as keyof typeof statusColors] || 'bg-gray-100'}>
                {walkthrough.status}
              </Badge>
            </div>
            <p className="text-gray-500">
              {scope?.site?.address || walkthrough.sites?.address || 'No address'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {walkthrough.status !== 'completed' && (
            <form action={updateWalkthroughStatus.bind(null, walkthrough.id, 'completed')}>
              <Button type="submit" variant="outline">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Square Footage</p>
                <p className="font-semibold">{scope?.site?.square_footage?.toLocaleString() || '—'} sq ft</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Service Frequency</p>
                <p className="font-semibold">{scope?.service?.days_per_week || '—'}x per week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Est. Hours/Visit</p>
                <p className="font-semibold">{scope?.pricing?.estimated_hours || '—'} hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600">Monthly Estimate</p>
                <p className="font-bold text-emerald-700">
                  {monthlyEstimate ? formatCurrency(monthlyEstimate) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer & Site Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scope?.customer ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{scope.customer.company_name || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">{scope.customer.contact_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{scope.customer.contact_phone || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{scope.customer.contact_email || '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No customer information captured</p>
            )}
          </CardContent>
        </Card>

        {/* Site Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Site Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scope?.site ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{scope.site.address || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Square Footage</p>
                    <p className="font-medium">{scope.site.square_footage?.toLocaleString() || '—'} sq ft</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Restrooms</p>
                    <p className="font-medium">{scope.site.restroom_count || '—'}</p>
                  </div>
                </div>
                {scope.site.flooring && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Flooring Breakdown</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <p className="text-xs text-gray-500">Hard Surface</p>
                        <p className="font-medium text-sm">{scope.site.flooring.hard_surface?.toLocaleString() || 0}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <p className="text-xs text-gray-500">Carpet</p>
                        <p className="font-medium text-sm">{scope.site.flooring.carpet?.toLocaleString() || 0}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <p className="text-xs text-gray-500">Tile</p>
                        <p className="font-medium text-sm">{scope.site.flooring.tile?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No site details captured</p>
            )}
          </CardContent>
        </Card>

        {/* Service Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              Service Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scope?.service ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Frequency</p>
                    <p className="font-medium">{scope.service.days_per_week}x per week</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time of Day</p>
                    <p className="font-medium capitalize">{scope.service.time_of_day || '—'}</p>
                  </div>
                </div>
                {scope.service.special_requirements && (
                  <div>
                    <p className="text-sm text-gray-500">Special Requirements</p>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{scope.service.special_requirements}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No service requirements captured</p>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Pricing Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scope?.pricing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="font-medium">${scope.pricing.hourly_rate}/hr</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Crew Size</p>
                    <p className="font-medium">{scope.pricing.estimated_crew_size} people</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hours/Visit</p>
                    <p className="font-medium">{scope.pricing.estimated_hours} hrs</p>
                  </div>
                </div>
                {monthlyEstimate && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-emerald-900">Monthly Estimate</span>
                      <span className="text-2xl font-bold text-emerald-700">{formatCurrency(monthlyEstimate)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No pricing details captured</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Media & Transcripts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Media Capture</CardTitle>
            <CardDescription>Photos, videos, and audio from the walkthrough</CardDescription>
          </CardHeader>
          <CardContent>
            {walkthrough.walkthrough_media?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {walkthrough.walkthrough_media.map((media: { id: string; type: string }) => (
                  <div key={media.id} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500">{media.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
                <p className="text-sm">No media captured yet</p>
                <p className="text-xs mt-1">Media capture coming soon</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcript & Notes</CardTitle>
            <CardDescription>Voice recordings and AI-extracted notes</CardDescription>
          </CardHeader>
          <CardContent>
            {transcript?.text ? (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{transcript.text}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
                <p className="text-sm">No transcript available</p>
                <p className="text-xs mt-1">Voice transcription coming soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
