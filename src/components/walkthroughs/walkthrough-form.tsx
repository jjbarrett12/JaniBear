'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Building2, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface WalkthroughFormProps {
  orgId: string;
  userId: string;
  userName?: string;
}

export function WalkthroughForm({ orgId, userId, userName }: WalkthroughFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingAISuggestions, setIsGettingAISuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    // Customer Info
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    
    // Site Info
    siteName: '',
    siteAddress: '',
    siteCity: '',
    siteState: '',
    siteZip: '',
    
    // Site Details
    squareFootage: '',
    flooringHardSurface: '',
    flooringCarpet: '',
    flooringTile: '',
    restroomCount: '',
    
    // Service Requirements
    daysPerWeek: '5',
    timeOfDay: 'evening',
    specialRequirements: '',
    
    // Pricing
    hourlyRate: '25',
    estimatedCrewSize: '',
    estimatedHours: '',
    
    // Schedule
    scheduledDate: '',
    scheduledTime: '',
  });

  const [aiSuggestions, setAiSuggestions] = useState<{
    crew_size?: number;
    hours_per_visit?: number;
    monthly_estimate?: number;
  } | null>(null);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAISuggestions = async () => {
    if (!formData.squareFootage) return;
    // AI suggestions endpoint removed with proposal section; manual entry only
    setIsGettingAISuggestions(true);
    setIsGettingAISuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Create client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          org_id: orgId,
          name: formData.companyName,
          created_by: userId,
        })
        .select()
        .single();

      if (clientError) throw new Error(`Client: ${clientError.message}`);

      // 2. Create client contact
      if (formData.contactName || formData.contactEmail) {
        await supabase.from('client_contacts').insert({
          org_id: orgId,
          client_id: client.id,
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone,
          role: 'primary',
        });
      }

      // 3. Create site (location)
      const { data: site, error: siteError } = await supabase
        .from('locations')
        .insert({
          org_id: orgId,
          name: formData.siteName || formData.companyName,
          address: formData.siteAddress,
          city: formData.siteCity,
          state: formData.siteState,
          zip: formData.siteZip,
          square_footage: parseInt(formData.squareFootage) || null,
        })
        .select()
        .single();

      if (siteError) throw new Error(`Site: ${siteError.message}`);

      // 4. Create opportunity
      const estimatedMRR = calculateMonthlyEstimate();
      const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .insert({
          org_id: orgId,
          client_id: client.id,
          site_id: site.id,
          stage: 'new',
          est_mrr: estimatedMRR,
          est_value: estimatedMRR * 12,
          owner_id: userId,
          created_by: userId,
        })
        .select()
        .single();

      if (oppError) throw new Error(`Opportunity: ${oppError.message}`);

      // 5. Create walkthrough
      const scheduledAt = formData.scheduledDate && formData.scheduledTime
        ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
        : new Date();

      const { data: walkthrough, error: walkError } = await supabase
        .from('walkthroughs')
        .insert({
          org_id: orgId,
          opportunity_id: opportunity.id,
          site_id: site.id,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
          created_by: userId,
        })
        .select()
        .single();

      if (walkError) throw new Error(`Walkthrough: ${walkError.message}`);

      // 6. Create scope model with the captured data
      await supabase.from('scope_models').insert({
        org_id: orgId,
        walkthrough_id: walkthrough.id,
        extracted_json: {
          site: {
            name: formData.siteName || formData.companyName,
            address: `${formData.siteAddress}, ${formData.siteCity}, ${formData.siteState} ${formData.siteZip}`,
            square_footage: parseInt(formData.squareFootage) || 0,
            flooring: {
              hard_surface: parseInt(formData.flooringHardSurface) || 0,
              carpet: parseInt(formData.flooringCarpet) || 0,
              tile: parseInt(formData.flooringTile) || 0,
            },
            restroom_count: parseInt(formData.restroomCount) || 0,
          },
          service: {
            days_per_week: parseInt(formData.daysPerWeek) || 5,
            time_of_day: formData.timeOfDay,
            special_requirements: formData.specialRequirements,
          },
          pricing: {
            hourly_rate: parseFloat(formData.hourlyRate) || 25,
            estimated_crew_size: parseInt(formData.estimatedCrewSize) || aiSuggestions?.crew_size || 2,
            estimated_hours: parseFloat(formData.estimatedHours) || aiSuggestions?.hours_per_visit || 2,
          },
          customer: {
            company_name: formData.companyName,
            contact_name: formData.contactName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
          },
          salesperson: {
            name: userName || 'Sales Team',
            user_id: userId,
          },
        },
        confidence: 1.0,
      });

      // Navigate to the walkthrough detail page
      router.push(`/app/walkthroughs/${walkthrough.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create walkthrough';
      setError(message);
      setIsLoading(false);
    }
  };

  const calculateMonthlyEstimate = () => {
    const hourlyRate = parseFloat(formData.hourlyRate) || 25;
    const crewSize = parseInt(formData.estimatedCrewSize) || aiSuggestions?.crew_size || 2;
    const hoursPerVisit = parseFloat(formData.estimatedHours) || aiSuggestions?.hours_per_visit || 2;
    const daysPerWeek = parseInt(formData.daysPerWeek) || 5;
    
    return hourlyRate * crewSize * hoursPerVisit * daysPerWeek * 4.33;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold
              ${step >= s ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}
            `}>
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-24 h-1 mx-2 ${step > s ? 'bg-amber-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Customer & Site Info */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-500" />
                Customer Information
              </CardTitle>
              <CardDescription>Enter the prospective client details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    placeholder="john@acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Site Location
              </CardTitle>
              <CardDescription>Where will services be performed?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name (optional)</Label>
                <Input
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  placeholder="Main Office Building"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteAddress">Street Address *</Label>
                <Input
                  id="siteAddress"
                  value={formData.siteAddress}
                  onChange={(e) => updateField('siteAddress', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="siteCity">City *</Label>
                  <Input
                    id="siteCity"
                    value={formData.siteCity}
                    onChange={(e) => updateField('siteCity', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteState">State *</Label>
                  <Input
                    id="siteState"
                    value={formData.siteState}
                    onChange={(e) => updateField('siteState', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteZip">ZIP Code</Label>
                  <Input
                    id="siteZip"
                    value={formData.siteZip}
                    onChange={(e) => updateField('siteZip', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)} size="lg">
              Continue to Site Details
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Site Details & Service Requirements */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
                Site Details
              </CardTitle>
              <CardDescription>Capture the physical characteristics of the space</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="squareFootage">Total Square Footage *</Label>
                  <Input
                    id="squareFootage"
                    type="number"
                    value={formData.squareFootage}
                    onChange={(e) => updateField('squareFootage', e.target.value)}
                    placeholder="10000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restroomCount">Number of Restrooms</Label>
                  <Input
                    id="restroomCount"
                    type="number"
                    value={formData.restroomCount}
                    onChange={(e) => updateField('restroomCount', e.target.value)}
                    placeholder="4"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Label className="text-base font-medium">Flooring Breakdown (sq ft)</Label>
                <p className="text-sm text-gray-500 mb-3">Estimate the flooring types</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="flooringHardSurface" className="text-sm">Hard Surface (VCT, etc.)</Label>
                    <Input
                      id="flooringHardSurface"
                      type="number"
                      value={formData.flooringHardSurface}
                      onChange={(e) => updateField('flooringHardSurface', e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flooringCarpet" className="text-sm">Carpet</Label>
                    <Input
                      id="flooringCarpet"
                      type="number"
                      value={formData.flooringCarpet}
                      onChange={(e) => updateField('flooringCarpet', e.target.value)}
                      placeholder="3000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flooringTile" className="text-sm">Tile</Label>
                    <Input
                      id="flooringTile"
                      type="number"
                      value={formData.flooringTile}
                      onChange={(e) => updateField('flooringTile', e.target.value)}
                      placeholder="2000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-500" />
                Service Requirements
              </CardTitle>
              <CardDescription>Define the cleaning schedule and special needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="daysPerWeek">Days Per Week</Label>
                  <select
                    id="daysPerWeek"
                    value={formData.daysPerWeek}
                    onChange={(e) => updateField('daysPerWeek', e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}/week</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeOfDay">Time of Service</Label>
                  <select
                    id="timeOfDay"
                    value={formData.timeOfDay}
                    onChange={(e) => updateField('timeOfDay', e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="morning">Morning (6am - 12pm)</option>
                    <option value="afternoon">Afternoon (12pm - 5pm)</option>
                    <option value="evening">Evening (5pm - 10pm)</option>
                    <option value="overnight">Overnight (10pm - 6am)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialRequirements">Special Requirements & Notes</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => updateField('specialRequirements', e.target.value)}
                  placeholder="Any special cleaning requirements, security protocols, areas of focus, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg">
              Back
            </Button>
            <Button type="button" onClick={() => { getAISuggestions(); setStep(3); }} size="lg">
              Continue to Pricing
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Pricing & Schedule */}
      {step === 3 && (
        <div className="space-y-6">
          {/* AI Suggestions Banner */}
          {(isGettingAISuggestions || aiSuggestions) && (
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">AI Recommendations</p>
                    {isGettingAISuggestions ? (
                      <p className="text-sm text-amber-700 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing site details...
                      </p>
                    ) : aiSuggestions ? (
                      <p className="text-sm text-amber-700">
                        Based on {formData.squareFootage} sq ft: {aiSuggestions.crew_size} crew members, ~{aiSuggestions.hours_per_visit?.toFixed(1)} hours/visit
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Pricing Estimate
              </CardTitle>
              <CardDescription>Set labor rates and staffing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => updateField('hourlyRate', e.target.value)}
                    placeholder="25.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedCrewSize">Crew Size</Label>
                  <Input
                    id="estimatedCrewSize"
                    type="number"
                    value={formData.estimatedCrewSize}
                    onChange={(e) => updateField('estimatedCrewSize', e.target.value)}
                    placeholder={aiSuggestions?.crew_size?.toString() || "2"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Hours Per Visit</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => updateField('estimatedHours', e.target.value)}
                    placeholder={aiSuggestions?.hours_per_visit?.toFixed(1) || "2"}
                  />
                </div>
              </div>

              {/* Estimated Monthly */}
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-emerald-900">Estimated Monthly:</span>
                  <span className="text-2xl font-bold text-emerald-700">
                    ${calculateMonthlyEstimate().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  {formData.estimatedCrewSize || aiSuggestions?.crew_size || 2} crew × {formData.estimatedHours || aiSuggestions?.hours_per_visit || 2} hrs × ${formData.hourlyRate}/hr × {formData.daysPerWeek} days × 4.33 weeks
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Schedule Walkthrough
              </CardTitle>
              <CardDescription>When will you visit the site?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => updateField('scheduledDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => updateField('scheduledTime', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)} size="lg">
              Back
            </Button>
            <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Walkthrough'
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
