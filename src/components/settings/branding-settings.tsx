'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [primaryColor, setPrimaryColor] = useState(initialData?.primary_color || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondary_color || '#64748b');
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/').pop();
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
          throw new Error('Logo storage is not set up. In Supabase SQL Editor run migration 005_create_logo_storage_bucket.sql (creates bucket "organization-logos" and policies).');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
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
    const path = logoUrl.split('/').pop();
    
    if (path) {
      await supabase.storage.from('organization-logos').remove([`${orgId}/${path}`]);
    }

    setLogoUrl(null);
    toast({
      title: 'Logo removed',
      description: 'Logo has been removed',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your branding settings have been saved',
      });

      // Reload to apply changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error saving branding:', error);
      const msg = error.message || 'Failed to save settings';
      const schemaCache = msg.includes('custom_branding') || msg.includes('schema cache');
      const hint = schemaCache
        ? ' Run migration 070_organizations_branding_columns_ensure.sql in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste file contents → Run).'
        : error.code === '42501' || msg.includes('policy') || msg.includes('row-level security')
          ? ' Only org owners and managers can save branding. If you are a manager, ask your admin to run migration 055_org_branding_update_policy.sql in Supabase.'
          : '';
      toast({
        title: 'Save failed',
        description: (schemaCache ? 'Database is missing branding columns. ' : '') + msg + hint,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & Customization</CardTitle>
        <CardDescription>
          Your logo appears in the sidebar. Upload your own to replace the default JANIBEAR logo, or remove it to use the default.
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
              Used for buttons, links, and primary actions
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
              Used for secondary elements and accents
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
          className="w-full h-14 text-lg"
        >
          {isSaving ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
