'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareReportButtonProps {
  inspectionId: string;
}

export function ShareReportButton({ inspectionId }: ShareReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
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
      setIsLoading(false);
      return;
    }

    try {
      // Generate unique token
      const token = crypto.randomUUID();

      // Create share record (expires in 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase.from('report_shares').insert({
        org_id: membership.org_id,
        inspection_id: inspectionId,
        token,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      const url = `${window.location.origin}/r/${token}`;
      setShareUrl(url);
    } catch (err: any) {
      alert('Failed to create share link: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="px-3 py-2 border rounded text-sm flex-1 max-w-md"
        />
        <Button onClick={handleCopy} variant="outline" size="sm">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleShare} variant="outline" disabled={isLoading}>
      <Share2 className="h-4 w-4 mr-2" />
      {isLoading ? 'Generating...' : 'Share Report'}
    </Button>
  );
}
