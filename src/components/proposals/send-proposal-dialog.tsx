'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Loader2, 
  CheckCircle2, 
  Mail,
  Copy,
  ExternalLink
} from 'lucide-react';

interface SendProposalDialogProps {
  proposalId: string;
  defaultEmail?: string;
  defaultName?: string;
  proposalTitle?: string;
  onSent?: () => void;
}

export function SendProposalDialog({
  proposalId,
  defaultEmail = '',
  defaultName = '',
  proposalTitle = 'Proposal',
  onSent,
}: SendProposalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!email) {
      setError('Please enter a recipient email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          recipientEmail: email,
          recipientName: name,
          personalMessage: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send proposal');
      }

      setSigningUrl(data.signingUrl);
      setIsSent(true);
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send proposal');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (signingUrl) {
      await navigator.clipboard.writeText(signingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Send className="h-4 w-4 mr-2" />
        Send for Signature
      </Button>
    );
  }

  if (isSent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Proposal Sent!</h2>
            <p className="text-gray-600 mt-2">
              The proposal has been sent to <strong>{email}</strong>
            </p>
          </div>

          {signingUrl && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">Signing Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={signingUrl} 
                  readOnly 
                  className="text-sm bg-white"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyLink}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(signingUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                You can also share this link directly with the customer
              </p>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={() => { setIsOpen(false); setIsSent(false); }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            Send for Signature
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Send &quot;{proposalTitle}&quot; to the customer for electronic signature
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to the email..."
              rows={3}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1"
            onClick={handleSend}
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Proposal
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
