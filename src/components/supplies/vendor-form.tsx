'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Truck, 
  Building2, 
  MapPin,
  CreditCard,
  Star
} from 'lucide-react';

interface VendorFormProps {
  orgId: string;
  vendor?: {
    id: string;
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    bill_to_company?: string;
    bill_to_address?: string;
    bill_to_city?: string;
    bill_to_state?: string;
    bill_to_zip?: string;
    ship_to_company?: string;
    ship_to_address?: string;
    ship_to_city?: string;
    ship_to_state?: string;
    ship_to_zip?: string;
    account_number?: string;
    payment_terms?: string;
    notes?: string;
    is_preferred?: boolean;
    is_active?: boolean;
  };
}

export function VendorForm({ orgId, vendor }: VendorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    contact_name: vendor?.contact_name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    website: vendor?.website || '',
    bill_to_company: vendor?.bill_to_company || '',
    bill_to_address: vendor?.bill_to_address || '',
    bill_to_city: vendor?.bill_to_city || '',
    bill_to_state: vendor?.bill_to_state || '',
    bill_to_zip: vendor?.bill_to_zip || '',
    ship_to_company: vendor?.ship_to_company || '',
    ship_to_address: vendor?.ship_to_address || '',
    ship_to_city: vendor?.ship_to_city || '',
    ship_to_state: vendor?.ship_to_state || '',
    ship_to_zip: vendor?.ship_to_zip || '',
    account_number: vendor?.account_number || '',
    payment_terms: vendor?.payment_terms || 'Net 30',
    notes: vendor?.notes || '',
    is_preferred: vendor?.is_preferred || false,
    is_active: vendor?.is_active ?? true,
  });

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyBillToShip = () => {
    setFormData(prev => ({
      ...prev,
      ship_to_company: prev.bill_to_company,
      ship_to_address: prev.bill_to_address,
      ship_to_city: prev.bill_to_city,
      ship_to_state: prev.bill_to_state,
      ship_to_zip: prev.bill_to_zip,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const vendorData = {
        org_id: orgId,
        ...formData,
        created_by: vendor ? undefined : user.id,
      };

      if (vendor) {
        const { error } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', vendor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert(vendorData);

        if (error) throw error;
      }

      router.push('/app/supplies/vendors');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vendor');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Vendor Information
          </CardTitle>
          <CardDescription>Basic details about the vendor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="ABC Supply Co."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="orders@supplier.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.supplier.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_preferred"
                checked={formData.is_preferred}
                onCheckedChange={(checked) => updateField('is_preferred', checked === true)}
              />
              <Label htmlFor="is_preferred" className="flex items-center gap-1 cursor-pointer">
                <Star className="h-4 w-4 text-amber-500" />
                Preferred Vendor
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField('is_active', checked === true)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill To Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            Bill To Address
          </CardTitle>
          <CardDescription>Your company&apos;s billing address for invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill_to_company">Company Name</Label>
            <Input
              id="bill_to_company"
              value={formData.bill_to_company}
              onChange={(e) => updateField('bill_to_company', e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill_to_address">Street Address</Label>
            <Input
              id="bill_to_address"
              value={formData.bill_to_address}
              onChange={(e) => updateField('bill_to_address', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bill_to_city">City</Label>
              <Input
                id="bill_to_city"
                value={formData.bill_to_city}
                onChange={(e) => updateField('bill_to_city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill_to_state">State</Label>
              <Input
                id="bill_to_state"
                value={formData.bill_to_state}
                onChange={(e) => updateField('bill_to_state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill_to_zip">ZIP Code</Label>
              <Input
                id="bill_to_zip"
                value={formData.bill_to_zip}
                onChange={(e) => updateField('bill_to_zip', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ship To Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Ship To Address
            </CardTitle>
            <CardDescription>Default delivery address for orders</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copyBillToShip}>
            Same as Bill To
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ship_to_company">Company Name</Label>
            <Input
              id="ship_to_company"
              value={formData.ship_to_company}
              onChange={(e) => updateField('ship_to_company', e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ship_to_address">Street Address</Label>
            <Input
              id="ship_to_address"
              value={formData.ship_to_address}
              onChange={(e) => updateField('ship_to_address', e.target.value)}
              placeholder="123 Warehouse Ave"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ship_to_city">City</Label>
              <Input
                id="ship_to_city"
                value={formData.ship_to_city}
                onChange={(e) => updateField('ship_to_city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ship_to_state">State</Label>
              <Input
                id="ship_to_state"
                value={formData.ship_to_state}
                onChange={(e) => updateField('ship_to_state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ship_to_zip">ZIP Code</Label>
              <Input
                id="ship_to_zip"
                value={formData.ship_to_zip}
                onChange={(e) => updateField('ship_to_zip', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-500" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => updateField('account_number', e.target.value)}
                placeholder="Your account number with this vendor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <select
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) => updateField('payment_terms', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Special instructions, account details, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : vendor ? (
            'Update Vendor'
          ) : (
            'Create Vendor'
          )}
        </Button>
      </div>
    </form>
  );
}
