'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';

const ACCEPT = '.pdf,.doc,.docx';
const MAX_MB = 15;

interface SDSUploadFormProps {
  orgId: string;
  /** After successful upload, go to list (default) or to the new sheet's edit page */
  redirectToEdit?: boolean;
}

export function SDSUploadForm({ orgId, redirectToEdit = false }: SDSUploadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [productName, setProductName] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    setFile(chosen);
    if (chosen && !productName.trim()) {
      const base = chosen.name.replace(/\.[^.]+$/, '');
      setProductName(base);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'Select a file', description: 'Choose an SDS document to upload.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Maximum size is ${MAX_MB}MB.`, variant: 'destructive' });
      return;
    }
    const name = productName.trim();
    if (!name) {
      toast({ title: 'Product name required', description: 'Enter the chemical or product name.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const ext = file.name.split('.').pop() || 'pdf';
      const storagePath = `${orgId}/sds/${Date.now()}_${name.slice(0, 40).replace(/[^a-zA-Z0-9-_]/g, '_')}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('sds-sheets')
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sds-sheets')
        .getPublicUrl(storagePath);

      const { data: row, error: insertError } = await supabase
        .from('sds_sheets')
        .insert({
          org_id: orgId,
          product_name: name,
          manufacturer: manufacturer.trim() || null,
          document_url: publicUrl,
          document_storage_path: storagePath,
          is_active: true,
          uploaded_by: user?.id ?? null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast({ title: 'SDS uploaded', description: `${name} has been added. You can add more details in the edit page.` });
      if (redirectToEdit && row?.id) {
        router.push(`/app/admin/sds/${row.id}/edit`);
      } else {
        router.push('/app/admin/sds');
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload SDS document
        </CardTitle>
        <CardDescription>
          Add a Safety Data Sheet for a chemical or product. Upload a PDF or document, then add the product name so it’s easy to find.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sds-product-name">Product / chemical name *</Label>
              <Input
                id="sds-product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Multi-Surface Cleaner"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sds-manufacturer">Manufacturer (optional)</Label>
              <Input
                id="sds-manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Acme Chemical Co."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>SDS document *</Label>
            <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25">
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">PDF, DOC, DOCX (max {MAX_MB}MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={ACCEPT}
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
          </div>

          <Button type="submit" disabled={isLoading || !file}>
            {isLoading ? 'Uploading…' : 'Upload SDS'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
