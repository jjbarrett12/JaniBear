'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateAccount } from '@/actions/accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import type { Database } from '@/lib/types/database';

type Account = Database['public']['Tables']['accounts']['Row'];

const LOGO_MAX_MB = 5;
const BUCKET = 'account-logos';

export function AccountEditForm({ account }: { account: Account }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(account.logo_url ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [name, setName] = useState(account.name);
  const [status, setStatus] = useState<'active' | 'inactive'>(account.status);
  const [billing_contact_name, setBillingContactName] = useState(account.billing_contact_name ?? '');
  const [billing_email, setBillingEmail] = useState(account.billing_email ?? '');
  const [billing_phone, setBillingPhone] = useState(account.billing_phone ?? '');
  const [billing_terms, setBillingTerms] = useState(account.billing_terms ?? '');
  const [contract_value_monthly, setContractValueMonthly] = useState(account.contract_value_monthly != null ? String(account.contract_value_monthly) : '');
  const [notes, setNotes] = useState(account.notes ?? '');
  const [user_limit, setUserLimit] = useState(String(account.user_limit ?? 5));

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image (e.g. PNG, JPG).', variant: 'destructive' });
      return;
    }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Logo must be under ${LOGO_MAX_MB}MB.`, variant: 'destructive' });
      return;
    }
    setLogoUploading(true);
    const supabase = createClient();
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${account.org_id}/${account.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('accounts').update({ logo_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', account.id);
      if (updateError) throw updateError;
      setLogoUrl(publicUrl);
      toast({ title: 'Logo uploaded' });
      router.refresh();
    } catch (err: unknown) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Could not upload logo', variant: 'destructive' });
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  }

  async function handleLogoRemove() {
    if (!logoUrl) return;
    const supabase = createClient();
    const match = logoUrl.match(/\/account-logos\/(.+)$/);
    const objectPath = match ? match[1] : null;
    setLogoUploading(true);
    try {
      if (objectPath) await supabase.storage.from(BUCKET).remove([objectPath]);
      await supabase.from('accounts').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', account.id);
      setLogoUrl(null);
      toast({ title: 'Logo removed' });
      router.refresh();
    } catch (err: unknown) {
      toast({ title: 'Remove failed', description: err instanceof Error ? err.message : 'Could not remove logo', variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await updateAccount(account.id, {
      name: name.trim(),
      status,
      logo_url: logoUrl,
      billing_contact_name: billing_contact_name.trim() || null,
      billing_email: billing_email.trim() || null,
      billing_phone: billing_phone.trim() || null,
      billing_terms: billing_terms.trim() || null,
      contract_value_monthly: contract_value_monthly ? parseFloat(contract_value_monthly) : null,
      notes: notes.trim() || null,
      user_limit: Math.max(1, parseInt(user_limit, 10) || 5),
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Update failed', description: error, variant: 'destructive' });
      return;
    }
    router.push(`/app/accounts/${account.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Account logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <Image src={logoUrl} alt="" width={80} height={80} className="h-full w-full object-contain" unoptimized />
                ) : (
                  <span className="text-muted-foreground text-xs">No logo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={logoUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {logoUrl ? 'Replace' : 'Upload'} logo
                </Button>
                {logoUrl && (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleLogoRemove} disabled={logoUploading}>
                    <X className="h-4 w-4 mr-2" />
                    Remove logo
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">PNG or JPG, max {LOGO_MAX_MB}MB. Shown on account detail and list.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Account name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'inactive')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing_contact">Billing contact</Label>
            <Input id="billing_contact" value={billing_contact_name} onChange={(e) => setBillingContactName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing_email">Billing email</Label>
            <Input id="billing_email" type="email" value={billing_email} onChange={(e) => setBillingEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing_phone">Billing phone</Label>
            <Input id="billing_phone" value={billing_phone} onChange={(e) => setBillingPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing_terms">Billing terms</Label>
            <Input id="billing_terms" value={billing_terms} onChange={(e) => setBillingTerms(e.target.value)} placeholder="e.g. Net 30" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract_value">Contract value (monthly)</Label>
            <Input id="contract_value" type="number" step="0.01" value={contract_value_monthly} onChange={(e) => setContractValueMonthly(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user_limit">User limit</Label>
            <Input
              id="user_limit"
              type="number"
              min={1}
              value={user_limit}
              onChange={(e) => setUserLimit(e.target.value)}
              placeholder="5"
            />
            <p className="text-xs text-muted-foreground">Maximum number of account users (admins) for this account. Must match the plan they pay for.</p>
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
