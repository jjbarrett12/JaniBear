'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/lib/theme-provider';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface BrandingSettingsProps {
  orgId: string;
  initialData?: {
    primary_color?: string | null;
    secondary_color?: string | null;
    logo_url?: string | null;
  };
}

export function BrandingSettings({ orgId, initialData }: BrandingSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [primaryColor, setPrimaryColor] = useState(initialData?.primary_color || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondary_color || '#64748b');
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSchemaHelp, setShowSchemaHelp] = useState(false);

  const BRANDING_MIGRATION_SQL = `-- Add branding columns to organizations (run in Supabase SQL Editor)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_branding BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_organizations_custom_branding ON organizations(custom_branding) WHERE custom_branding = true;`;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    try {
      // Delete old logo if exists (path is everything after bucket name in URL)
      if (logoUrl) {
        const pathMatch = logoUrl.match(/organization-logos\/(.+)$/);
        const oldPath = pathMatch ? pathMatch[1] : null;
        if (oldPath) {
          await supabase.storage.from('organization-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${orgId}-${Date.now()}.${fileExt}`;
      const filePath = `${orgId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found') || uploadError.message?.includes('bucket') || uploadError.message?.includes('storage')) {
          throw new Error('Logo storage is not set up. Run the Supabase migration 074_organization_logos_storage_ensure.sql in the SQL Editor (Dashboard → SQL Editor), or run: supabase db push');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);

      // Persist logo_url to organizations so it survives refresh
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', orgId);
      if (updateError) {
        console.warn('Logo uploaded but organizations update failed:', updateError);
      }

      router.refresh();
      toast({
        title: 'Logo uploaded',
        description: 'Logo has been uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload logo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    const supabase = createClient();
    const pathMatch = logoUrl.match(/organization-logos\/(.+)$/);
    const path = pathMatch ? pathMatch[1] : null;

    if (path) {
      await supabase.storage.from('organization-logos').remove([path]);
    }

    const { error } = await supabase
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', orgId);
    if (error) {
      toast({
        title: 'Remove failed',
        description: error.message ?? 'Could not clear logo from organization',
        variant: 'destructive',
      });
      return;
    }

    setLogoUrl(null);
    router.refresh();
    toast({
      title: 'Logo removed',
      description: 'Logo has been removed',
    });
  };

  const normalizeHex = (v: string) => {
    const s = (v || '').trim();
    if (!s) return s;
    if (s.startsWith('#')) return s;
    if (/^[0-9A-Fa-f]{6}$/.test(s)) return `#${s}`;
    return s;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const primary = normalizeHex(primaryColor);
    const secondary = normalizeHex(secondaryColor);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          primary_color: primary || null,
          secondary_color: secondary || null,
          logo_url: logoUrl,
        })
        .eq('id', orgId);

      if (error) throw error;

      setTheme({
        primary: primary || primaryColor,
        secondary: secondary || secondaryColor,
        logoUrl: logoUrl ?? null,
      });

      // Re-fetch layout data so sidebar/header get new logo and next full load uses new colors
      router.refresh();

      toast({
        title: 'Settings saved',
        description: 'Brand colors and logo are applied across the app.',
      });
    } catch (error: any) {
      console.error('Error saving branding:', error);
      const msg = error.message || 'Failed to save settings';
      const isSchemaError =
        msg.includes('schema cache') ||
        msg.includes('custom_branding') ||
        msg.includes("'logo_url'") ||
        msg.includes("'primary_color'") ||
        msg.includes("'secondary_color'") ||
        /Could not find the .* column/.test(msg);
      if (isSchemaError) setShowSchemaHelp(true);
      const hint = isSchemaError
        ? ' Run the SQL below in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run), then try saving again.'
        : error.code === '42501' || msg.includes('policy') || msg.includes('row-level security')
          ? ' Only org owners and managers can save branding. If you are a manager, ask your admin to run migration 055_org_branding_update_policy.sql in Supabase.'
          : '';
      toast({
        title: 'Save failed',
        description: (isSchemaError ? 'Database is missing branding columns. ' : '') + msg + hint,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding &amp; company colors</CardTitle>
        <CardDescription>
          Set your company colors and logo. Colors apply app-wide: buttons, links, focus rings, sidebar accents, and primary actions. Logo appears in the sidebar. If colors or logo don’t update, run migrations 070 and 074 in Supabase SQL Editor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Company Logo (sidebar)</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <Image
                  src={logoUrl}
                  alt="Company Logo"
                  width={120}
                  height={60}
                  className="h-16 w-auto object-contain border rounded p-2 bg-white"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-16 w-32 border-2 border-dashed rounded flex items-center justify-center bg-gray-50">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoUpload}
                disabled={isUploading}
                className="hidden"
                id="logo-upload"
                aria-label="Upload logo"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                className="w-full h-14 text-base"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 mr-2" />
                {isUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, or SVG. Max 5MB. Recommended: 200x60px. Leave empty to keep the default JANIBEAR logo.
              </p>
            </div>
          </div>
        </div>

        {/* Color Customization */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-16 w-24 p-1 cursor-pointer border-2"
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              Buttons, links, focus rings, and primary actions across the app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="secondary-color"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-16 w-24 p-1 cursor-pointer border-2"
              />
              <Input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#64748b"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              Secondary buttons, borders, and accents app-wide
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <Label className="text-sm font-medium mb-3 block">Preview</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                style={{ backgroundColor: primaryColor }}
                className="text-white"
                size="lg"
              >
                Primary Button
              </Button>
              <Button
                variant="outline"
                style={{ borderColor: secondaryColor, color: secondaryColor }}
                size="lg"
              >
                Secondary Button
              </Button>
            </div>
            {logoUrl && (
              <div className="pt-2">
                <Image
                  src={logoUrl}
                  alt="Preview"
                  width={100}
                  height={30}
                  className="h-8 w-auto"
                />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="w-full h-14 text-lg text-white border-0"
          style={{ backgroundColor: primaryColor }}
        >
          {isSaving ? 'Saving...' : 'Save Branding Settings'}
        </Button>

        {showSchemaHelp && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Fix: run this SQL in Supabase
            </p>
            <p className="text-xs text-muted-foreground">
              Supabase Dashboard → SQL Editor → New query → paste the SQL below → Run. Then try saving again.
            </p>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">
              {BRANDING_MIGRATION_SQL}
            </pre>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(BRANDING_MIGRATION_SQL);
                toast({ title: 'SQL copied', description: 'Paste in Supabase SQL Editor and run.' });
              }}
            >
              Copy SQL
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
