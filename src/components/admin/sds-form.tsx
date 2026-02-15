'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

export interface SDSSheetRow {
  id: string;
  org_id: string;
  product_name: string;
  manufacturer: string | null;
  product_code?: string | null;
  cas_number?: string | null;
  version: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  document_url: string;
  document_storage_path?: string | null;
  hazard_classifications?: string[] | null;
  precautionary_statements?: string[] | null;
  storage_requirements?: string | null;
  disposal_requirements?: string | null;
  emergency_procedures?: string | null;
  ai_summary?: string | null;
  ai_key_hazards?: string[] | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SDSFormProps {
  sdsSheet: SDSSheetRow;
}

export function SDSForm({ sdsSheet }: SDSFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productName, setProductName] = useState(sdsSheet.product_name ?? '');
  const [manufacturer, setManufacturer] = useState(sdsSheet.manufacturer ?? '');
  const [productCode, setProductCode] = useState(sdsSheet.product_code ?? '');
  const [casNumber, setCasNumber] = useState(sdsSheet.cas_number ?? '');
  const [version, setVersion] = useState(sdsSheet.version ?? '');
  const [issueDate, setIssueDate] = useState(sdsSheet.issue_date?.slice(0, 10) ?? '');
  const [expirationDate, setExpirationDate] = useState(sdsSheet.expiration_date?.slice(0, 10) ?? '');
  const [documentUrl, setDocumentUrl] = useState(sdsSheet.document_url ?? '');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [storageRequirements, setStorageRequirements] = useState(sdsSheet.storage_requirements ?? '');
  const [disposalRequirements, setDisposalRequirements] = useState(sdsSheet.disposal_requirements ?? '');
  const [emergencyProcedures, setEmergencyProcedures] = useState(sdsSheet.emergency_procedures ?? '');
  const [aiSummary, setAiSummary] = useState(sdsSheet.ai_summary ?? '');
  const [isActive, setIsActive] = useState(sdsSheet.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast({ title: 'Error', description: 'Product name is required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      let finalDocumentUrl = documentUrl.trim() || sdsSheet.document_url;
      let finalStoragePath: string | null = sdsSheet.document_storage_path ?? null;

      if (replaceFile) {
        const ext = replaceFile.name.split('.').pop() || 'pdf';
        const storagePath = `${sdsSheet.org_id}/sds/${Date.now()}_${productName.slice(0, 40).replace(/[^a-zA-Z0-9-_]/g, '_')}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('sds-sheets')
          .upload(storagePath, replaceFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('sds-sheets').getPublicUrl(storagePath);
        finalDocumentUrl = publicUrl;
        finalStoragePath = storagePath;
      }

      const { error } = await supabase
        .from('sds_sheets')
        .update({
          product_name: productName.trim(),
          manufacturer: manufacturer.trim() || null,
          product_code: productCode.trim() || null,
          cas_number: casNumber.trim() || null,
          version: version.trim() || null,
          issue_date: issueDate || null,
          expiration_date: expirationDate || null,
          document_url: finalDocumentUrl,
          document_storage_path: finalStoragePath,
          storage_requirements: storageRequirements.trim() || null,
          disposal_requirements: disposalRequirements.trim() || null,
          emergency_procedures: emergencyProcedures.trim() || null,
          ai_summary: aiSummary.trim() || null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sdsSheet.id)
        .eq('org_id', sdsSheet.org_id);

      if (error) throw error;
      toast({ title: 'Saved', description: 'SDS sheet updated successfully.' });
      router.push('/app/admin/sds');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update SDS sheet';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product_name">Product name *</Label>
              <Input
                id="product_name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Manufacturer"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product_code">Product code</Label>
              <Input
                id="product_code"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Product code"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cas_number">CAS number</Label>
              <Input
                id="cas_number"
                value={casNumber}
                onChange={(e) => setCasNumber(e.target.value)}
                placeholder="CAS number"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="Version"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_url">Document URL</Label>
              <Input
                id="document_url"
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://... or upload below"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Replace document (optional)</Label>
            <label className="flex flex-col items-center justify-center w-full min-h-[80px] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25">
              <div className="flex flex-col items-center justify-center py-4 px-4">
                <p className="text-sm text-muted-foreground">
                  {replaceFile ? replaceFile.name : 'Click to upload a new PDF or document'}
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">PDF, DOC, DOCX</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue date</Label>
              <Input
                id="issue_date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration date</Label>
              <Input
                id="expiration_date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage_requirements">Storage requirements</Label>
            <Textarea
              id="storage_requirements"
              value={storageRequirements}
              onChange={(e) => setStorageRequirements(e.target.value)}
              placeholder="Storage requirements"
              rows={2}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disposal_requirements">Disposal requirements</Label>
            <Textarea
              id="disposal_requirements"
              value={disposalRequirements}
              onChange={(e) => setDisposalRequirements(e.target.value)}
              placeholder="Disposal requirements"
              rows={2}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_procedures">Emergency procedures</Label>
            <Textarea
              id="emergency_procedures"
              value={emergencyProcedures}
              onChange={(e) => setEmergencyProcedures(e.target.value)}
              placeholder="Emergency procedures"
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai_summary">AI summary</Label>
            <Textarea
              id="ai_summary"
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="Summary or notes"
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="font-normal cursor-pointer">Active</Label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => router.push('/app/admin/sds')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
