'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface LocationFormProps {
  initialData?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    square_footage?: number | null;
    notes?: string | null;
    status?: string | null;
    sqft_by_flooring_type?: Record<string, number> | null;
    restroom_count?: number | null;
    days_of_service?: string | null;
    door_alarm_code?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    billing_contact_name?: string | null;
    billing_contact_phone?: string | null;
    billing_contact_email?: string | null;
    billing_address?: string | null;
    billing_notes?: string | null;
    account_billing_notes?: string | null;
    authorized_to_order_supplies?: boolean | null;
    contract_storage_path?: string | null;
    types_of_supplies_used?: string[] | null;
    special_instructions?: string | null;
  };
}

/** Flooring type keys used in sqft_by_flooring_type JSONB */
const FLOORING_TYPES = [
  { key: 'carpet', label: 'Carpet' },
  { key: 'tile', label: 'Tile' },
  { key: 'vct_tile', label: 'VCT Tile' },
  { key: 'ceramic_tile', label: 'Ceramic Tile' },
  { key: 'lvt', label: 'LVT' },
  { key: 'wood', label: 'Wood' },
  { key: 'vinyl', label: 'Vinyl' },
  { key: 'other', label: 'Other' },
] as const;

function getSqftByFlooringFromObject(obj: Record<string, number> | null): Record<string, string> {
  const out: Record<string, string> = {};
  FLOORING_TYPES.forEach(({ key }) => {
    const v = obj?.[key];
    out[key] = v != null && !isNaN(Number(v)) ? String(v) : '';
  });
  return out;
}

function buildSqftByFlooringObject(sqftByFlooring: Record<string, string>): Record<string, number> | null {
  const out: Record<string, number> = {};
  Object.entries(sqftByFlooring).forEach(([key, value]) => {
    const num = parseFloat(String(value).replace(/,/g, ''));
    if (!isNaN(num) && num > 0) out[key] = num;
  });
  return Object.keys(out).length ? out : null;
}

function formatServiceAddress(address: string, city: string, state: string, zip: string): string {
  const parts = [address, city, state, zip].filter(Boolean).join(', ');
  return parts.trim() || '';
}

export function LocationForm({ initialData }: LocationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceAddressFormatted = formatServiceAddress(
    initialData?.address || '',
    initialData?.city || '',
    initialData?.state || '',
    initialData?.zip || ''
  );
  const initialBillingSameAsService =
    !!initialData?.billing_address &&
    initialData.billing_address.trim() === serviceAddressFormatted.trim();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    square_footage: initialData?.square_footage?.toString() || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'active',
    sqft_by_flooring: getSqftByFlooringFromObject(initialData?.sqft_by_flooring_type ?? null),
    restroom_count: initialData?.restroom_count?.toString() || '',
    days_of_service: initialData?.days_of_service || '',
    door_alarm_code: initialData?.door_alarm_code || '',
    contact_name: initialData?.contact_name || '',
    contact_phone: initialData?.contact_phone || '',
    contact_email: initialData?.contact_email || '',
    billing_contact_name: initialData?.billing_contact_name || '',
    billing_contact_phone: initialData?.billing_contact_phone || '',
    billing_contact_email: initialData?.billing_contact_email || '',
    billing_address: initialData?.billing_address || '',
    billing_same_as_service: initialBillingSameAsService,
    billing_notes: initialData?.billing_notes || '',
    account_billing_notes: initialData?.account_billing_notes || '',
    authorized_to_order_supplies: initialData?.authorized_to_order_supplies ?? false,
    contract_storage_path: initialData?.contract_storage_path || '',
    types_of_supplies_used: (initialData?.types_of_supplies_used ?? []).join(', '),
    special_instructions: initialData?.special_instructions || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const sqftByFlooring = buildSqftByFlooringObject(formData.sqft_by_flooring);
      const billingAddress =
        formData.billing_same_as_service
          ? formatServiceAddress(formData.address, formData.city, formData.state, formData.zip)
          : formData.billing_address;
      const typesOfSupplies = formData.types_of_supplies_used
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const locationData = {
        org_id: membership.org_id,
        name: formData.name,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        square_footage: formData.square_footage ? parseFloat(formData.square_footage) : null,
        notes: formData.notes || null,
        status: formData.status,
        sqft_by_flooring_type: sqftByFlooring,
        restroom_count: formData.restroom_count ? parseInt(formData.restroom_count, 10) : null,
        days_of_service: formData.days_of_service || null,
        door_alarm_code: formData.door_alarm_code || null,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        billing_contact_name: formData.billing_contact_name || null,
        billing_contact_phone: formData.billing_contact_phone || null,
        billing_contact_email: formData.billing_contact_email || null,
        billing_address: billingAddress || null,
        billing_notes: formData.billing_notes || null,
        account_billing_notes: formData.account_billing_notes || null,
        authorized_to_order_supplies: formData.authorized_to_order_supplies,
        contract_storage_path: formData.contract_storage_path || null,
        types_of_supplies_used: typesOfSupplies.length ? typesOfSupplies : null,
        special_instructions: formData.special_instructions || null,
      };

      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', initialData.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('locations').insert(locationData);
        if (insertError) throw insertError;
      }
      router.push(initialData?.id ? `/app/locations/${initialData.id}` : '/app/locations');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basics */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Name, address, and account status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Location name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Account status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={isLoading} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} disabled={isLoading} maxLength={2} placeholder="CA" className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} disabled={isLoading} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="square_footage">Total square footage</Label>
            <Input
              id="square_footage"
              type="number"
              min={0}
              value={formData.square_footage}
              onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="mb-2 block">Square footage by flooring type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
              {FLOORING_TYPES.map(({ key, label }) => (
                <div key={key}>
                  <Label htmlFor={`sqft_${key}`} className="text-xs text-gray-500 font-normal">
                    {label}
                  </Label>
                  <Input
                    id={`sqft_${key}`}
                    type="number"
                    min={0}
                    value={formData.sqft_by_flooring[key] ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sqft_by_flooring: {
                          ...formData.sqft_by_flooring,
                          [key]: e.target.value,
                        },
                      })
                    }
                    disabled={isLoading}
                    placeholder="0"
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Enter sq ft for each flooring type. Leave blank if not applicable.</p>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} disabled={isLoading} rows={3} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Service details */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Service details</CardTitle>
          <CardDescription>Restrooms, days of service, access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="restroom_count">Restroom count</Label>
            <Input
              id="restroom_count"
              type="number"
              value={formData.restroom_count}
              onChange={(e) => setFormData({ ...formData, restroom_count: e.target.value })}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="days_of_service">Days of service</Label>
            <Input
              id="days_of_service"
              value={formData.days_of_service}
              onChange={(e) => setFormData({ ...formData, days_of_service: e.target.value })}
              disabled={isLoading}
              placeholder="e.g. Mon, Wed, Fri or 5x/week"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="door_alarm_code">Door / alarm code</Label>
            <Input
              id="door_alarm_code"
              type="password"
              value={formData.door_alarm_code}
              onChange={(e) => setFormData({ ...formData, door_alarm_code: e.target.value })}
              disabled={isLoading}
              placeholder="Keep confidential"
              className="mt-1 font-mono"
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Contact info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact_name">Contact name</Label>
            <Input id="contact_name" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} disabled={isLoading} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="contact_phone">Contact phone</Label>
            <Input id="contact_phone" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} disabled={isLoading} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="contact_email">Contact email</Label>
            <Input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} disabled={isLoading} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Billing info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="billing_same_as_service"
              checked={formData.billing_same_as_service}
              onCheckedChange={(checked) => {
                const same = !!checked;
                setFormData({
                  ...formData,
                  billing_same_as_service: same,
                  billing_address: same
                    ? formatServiceAddress(formData.address, formData.city, formData.state, formData.zip)
                    : formData.billing_address,
                });
              }}
              disabled={isLoading}
            />
            <Label htmlFor="billing_same_as_service">Billing address same as service address</Label>
          </div>
          <div>
            <Label htmlFor="billing_contact_name">Billing contact name</Label>
            <Input id="billing_contact_name" value={formData.billing_contact_name} onChange={(e) => setFormData({ ...formData, billing_contact_name: e.target.value })} disabled={isLoading} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="billing_contact_phone">Billing phone</Label>
            <Input id="billing_contact_phone" value={formData.billing_contact_phone} onChange={(e) => setFormData({ ...formData, billing_contact_phone: e.target.value })} disabled={isLoading} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="billing_contact_email">Billing email</Label>
            <Input id="billing_contact_email" type="email" value={formData.billing_contact_email} onChange={(e) => setFormData({ ...formData, billing_contact_email: e.target.value })} disabled={isLoading} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="billing_address">Billing address</Label>
            <Textarea
              id="billing_address"
              value={
                formData.billing_same_as_service
                  ? formatServiceAddress(formData.address, formData.city, formData.state, formData.zip)
                  : formData.billing_address
              }
              onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
              disabled={isLoading || formData.billing_same_as_service}
              rows={2}
              className="mt-1"
              placeholder={formData.billing_same_as_service ? 'Same as service address' : undefined}
            />
            {formData.billing_same_as_service && (
              <p className="text-xs text-gray-500 mt-1">Using service address above. Uncheck to enter a different billing address.</p>
            )}
          </div>
          <div>
            <Label htmlFor="billing_notes">Billing notes</Label>
            <Textarea id="billing_notes" value={formData.billing_notes} onChange={(e) => setFormData({ ...formData, billing_notes: e.target.value })} disabled={isLoading} rows={2} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="account_billing_notes">Account billing notes</Label>
            <Textarea id="account_billing_notes" value={formData.account_billing_notes} onChange={(e) => setFormData({ ...formData, account_billing_notes: e.target.value })} disabled={isLoading} rows={2} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Supplies & documents */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Supplies & documents</CardTitle>
          <CardDescription>Authorization to order supplies, types used, contract</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="authorized_to_order_supplies"
              checked={formData.authorized_to_order_supplies}
              onCheckedChange={(checked) => setFormData({ ...formData, authorized_to_order_supplies: !!checked })}
              disabled={isLoading}
            />
            <Label htmlFor="authorized_to_order_supplies">Authorized to order supplies</Label>
          </div>
          <div>
            <Label htmlFor="types_of_supplies_used">Types of supplies used</Label>
            <Input
              id="types_of_supplies_used"
              value={formData.types_of_supplies_used}
              onChange={(e) => setFormData({ ...formData, types_of_supplies_used: e.target.value })}
              disabled={isLoading}
              placeholder="e.g. glass cleaner, mop heads, trash bags"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="contract_storage_path">Contract document (path or URL)</Label>
            <Input
              id="contract_storage_path"
              value={formData.contract_storage_path}
              onChange={(e) => setFormData({ ...formData, contract_storage_path: e.target.value })}
              disabled={isLoading}
              placeholder="After uploading contract, paste path or link here"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="special_instructions">Special instructions</Label>
            <Textarea
              id="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              disabled={isLoading}
              rows={4}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} size="lg" className="flex-1">
          {isLoading ? 'Saving...' : initialData ? 'Update location' : 'Create location'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg" className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
