'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function BidCalculator() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [businessType, setBusinessType] = useState('');
  const [locationId, setLocationId] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [hourlyRate, setHourlyRate] = useState('25');
  const [restrooms, setRestrooms] = useState('0');
  const [stalls, setStalls] = useState('0');
  const [sinks, setSinks] = useState('0');
  const [flooringTypes, setFlooringTypes] = useState<Array<{ type: string; sqft: string }>>([]);

  const [estimatedLabor, setEstimatedLabor] = useState(0);
  const [estimatedSupplies, setEstimatedSupplies] = useState(0);
  const [estimatedChemicals, setEstimatedChemicals] = useState(0);
  const [totalEstimate, setTotalEstimate] = useState(0);

  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function loadLocations() {
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

      const { data: locs } = await supabase
        .from('locations')
        .select('id, name')
        .eq('org_id', membership.org_id)
        .order('name');
      if (locs) setLocations(locs);
    }

    loadLocations();
  }, []);

  useEffect(() => {
    calculateEstimate();
  }, [squareFootage, daysPerWeek, hourlyRate, restrooms, stalls, sinks, flooringTypes]);

  const calculateEstimate = () => {
    const sqft = parseFloat(squareFootage) || 0;
    const days = parseFloat(daysPerWeek) || 0;
    const rate = parseFloat(hourlyRate) || 0;

    // Labor calculation: assume 0.5 hours per 1000 sqft per day
    const hoursPerDay = (sqft / 1000) * 0.5;
    const weeklyHours = hoursPerDay * days;
    const monthlyHours = weeklyHours * 4.33;
    const laborCost = monthlyHours * rate;

    // Supply costs: $0.10 per sqft per month
    const supplyCost = sqft * 0.10;

    // Chemical costs: based on restrooms and area
    const chemicalCost = (parseFloat(restrooms) * 50) + (sqft * 0.05);

    setEstimatedLabor(laborCost);
    setEstimatedSupplies(supplyCost);
    setEstimatedChemicals(chemicalCost);
    setTotalEstimate(laborCost + supplyCost + chemicalCost);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('You must be logged in');
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
      setError('You must belong to an organization');
      setIsLoading(false);
      return;
    }

    try {
      await supabase.from('bids').insert({
        org_id: membership.org_id,
        location_id: locationId || null,
        business_type: businessType,
        square_footage: parseFloat(squareFootage) || null,
        flooring_types: flooringTypes.length > 0 ? flooringTypes : null,
        restrooms_count: parseInt(restrooms) || 0,
        stalls_count: parseInt(stalls) || 0,
        sinks_count: parseInt(sinks) || 0,
        days_per_week: parseInt(daysPerWeek) || 0,
        hourly_rate: parseFloat(hourlyRate) || 0,
        estimated_labor_cost: estimatedLabor,
        estimated_supply_cost: estimatedSupplies,
        estimated_chemical_cost: estimatedChemicals,
        total_estimated_cost: totalEstimate,
        status: 'draft',
      });

      router.push('/app/bids');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save bid');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bid Details</CardTitle>
            <CardDescription>Enter information to calculate estimate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Input
                id="business_type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="Office, Retail, Medical, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="square_footage">Square Footage</Label>
              <Input
                id="square_footage"
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                placeholder="5000"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restrooms">Restrooms</Label>
                <Input
                  id="restrooms"
                  type="number"
                  value={restrooms}
                  onChange={(e) => setRestrooms(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stalls">Stalls</Label>
                <Input
                  id="stalls"
                  type="number"
                  value={stalls}
                  onChange={(e) => setStalls(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sinks">Sinks</Label>
                <Input
                  id="sinks"
                  type="number"
                  value={sinks}
                  onChange={(e) => setSinks(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days_per_week">Days Per Week</Label>
                <Input
                  id="days_per_week"
                  type="number"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                  min="1"
                  max="7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Labor</span>
                <span className="font-medium">${estimatedLabor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Supplies</span>
                <span className="font-medium">${estimatedSupplies.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chemicals</span>
                <span className="font-medium">${estimatedChemicals.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total (Monthly)</span>
                <span className="text-2xl font-bold text-primary">
                  ${totalEstimate.toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button onClick={handleSave} className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Bid'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
