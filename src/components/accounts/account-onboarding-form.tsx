'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAccountWithFacilities, createBuildingAsAccountBatch } from '@/actions/accounts';

type Step = 'multi' | 'single';

export function AccountOnboardingForm() {
  const [step, setStep] = useState<Step>('multi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi: one account, multiple facilities
  const [accountName, setAccountName] = useState('');
  const [facilities, setFacilities] = useState<{ name: string; address_line1: string; city: string; state: string; zip: string }[]>([
    { name: '', address_line1: '', city: '', state: '', zip: '' },
  ]);

  // Single: each building = account
  const [buildings, setBuildings] = useState<{ name: string; address_line1: string; city: string; state: string; zip: string }[]>([
    { name: '', address_line1: '', city: '', state: '', zip: '' },
  ]);
  const [companyName, setCompanyName] = useState('');
  const [firstAdminEmail, setFirstAdminEmail] = useState('');

  const addFacility = () => setFacilities((f) => [...f, { name: '', address_line1: '', city: '', state: '', zip: '' }]);
  const removeFacility = (i: number) => setFacilities((f) => f.filter((_, idx) => idx !== i));

  const addBuilding = () => setBuildings((b) => [...b, { name: '', address_line1: '', city: '', state: '', zip: '' }]);
  const removeBuilding = (i: number) => setBuildings((b) => b.filter((_, idx) => idx !== i));

  const submitMulti = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = {
      account_name: accountName.trim(),
      status: 'active' as const,
      first_admin_email: firstAdminEmail.trim() || null,
      facilities: facilities
        .filter((f) => f.name.trim())
        .map((f, i) => ({
          name: f.name.trim(),
          address_line1: f.address_line1.trim() || null,
          city: f.city.trim() || null,
          state: f.state.trim() || null,
          zip: f.zip.trim() || null,
          is_primary: i === 0,
        })),
    };
    if (payload.facilities.length === 0) {
      setError('Add at least one facility with a name.');
      setLoading(false);
      return;
    }
    const result = await createAccountWithFacilities(payload);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!result.accountId) {
      setError('Account was not created. Please try again.');
      return;
    }
    if (result.inviteLink && firstAdminEmail.trim()) {
      const fullLink = typeof window !== 'undefined' ? `${window.location.origin}${result.inviteLink}` : result.inviteLink;
      navigator.clipboard.writeText(fullLink).catch(() => {});
    }
    window.location.href = `/app/accounts/${result.accountId}`;
  };

  const submitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const list = buildings.filter((b) => b.name.trim()).map((b) => ({
      name: b.name.trim(),
      address_line1: b.address_line1.trim() || null,
      city: b.city.trim() || null,
      state: b.state.trim() || null,
      zip: b.zip.trim() || null,
    }));
    if (list.length === 0) {
      setError('Add at least one building with a name.');
      setLoading(false);
      return;
    }
    const result = await createBuildingAsAccountBatch(list, companyName.trim() || undefined);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.accountIds?.length) {
      window.location.href = `/app/accounts/${result.accountIds[0]}`;
    } else {
      window.location.href = '/app/accounts';
    }
  };

  if (step === 'multi') {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>New account with facilities</CardTitle>
              <CardDescription>One account, multiple buildings. You can add or move facilities later.</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep('single')}>One account per building</Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitMulti} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="account_name">Account name *</Label>
              <Input
                id="account_name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Acme Properties"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_admin_email">First account admin email (optional)</Label>
              <Input
                id="first_admin_email"
                type="email"
                value={firstAdminEmail}
                onChange={(e) => setFirstAdminEmail(e.target.value)}
                placeholder="Invite someone to manage this account"
              />
              <p className="text-xs text-muted-foreground">We’ll create an invite link; send it to them so they can join and manage employees, schedules, and facilities.</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Facilities (buildings) *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFacility}>Add facility</Button>
              </div>
              <div className="space-y-4">
                {facilities.map((f, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Facility {i + 1}</span>
                      {facilities.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFacility(i)}>Remove</Button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label>Name *</Label>
                        <Input value={f.name} onChange={(e) => setFacilities((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} placeholder="Building name" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Address</Label>
                        <Input value={f.address_line1} onChange={(e) => setFacilities((prev) => { const n = [...prev]; n[i] = { ...n[i], address_line1: e.target.value }; return n; })} placeholder="Street address" />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input value={f.city} onChange={(e) => setFacilities((prev) => { const n = [...prev]; n[i] = { ...n[i], city: e.target.value }; return n; })} placeholder="City" />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input value={f.state} onChange={(e) => setFacilities((prev) => { const n = [...prev]; n[i] = { ...n[i], state: e.target.value }; return n; })} placeholder="State" />
                      </div>
                      <div>
                        <Label>ZIP</Label>
                        <Input value={f.zip} onChange={(e) => setFacilities((prev) => { const n = [...prev]; n[i] = { ...n[i], zip: e.target.value }; return n; })} placeholder="ZIP" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account & facilities'}</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Each building as its own account</CardTitle>
            <CardDescription>We’ll create one account per building</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setStep('multi')}>One account, multiple buildings</Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitSingle} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company name (optional)</Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp — will appear as 'Acme Corp - Building A'"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Buildings *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addBuilding}>Add building</Button>
            </div>
            <div className="space-y-4">
              {buildings.map((b, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Building {i + 1}</span>
                    {buildings.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBuilding(i)}>Remove</Button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Name *</Label>
                      <Input value={b.name} onChange={(e) => setBuildings((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} placeholder="Building name" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Address</Label>
                      <Input value={b.address_line1} onChange={(e) => setBuildings((prev) => { const n = [...prev]; n[i] = { ...n[i], address_line1: e.target.value }; return n; })} placeholder="Street address" />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input value={b.city} onChange={(e) => setBuildings((prev) => { const n = [...prev]; n[i] = { ...n[i], city: e.target.value }; return n; })} placeholder="City" />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input value={b.state} onChange={(e) => setBuildings((prev) => { const n = [...prev]; n[i] = { ...n[i], state: e.target.value }; return n; })} placeholder="State" />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input value={b.zip} onChange={(e) => setBuildings((prev) => { const n = [...prev]; n[i] = { ...n[i], zip: e.target.value }; return n; })} placeholder="ZIP" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create accounts'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
