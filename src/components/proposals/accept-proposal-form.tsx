'use client';

import { useState } from 'react';
import { SignaturePad } from '@/components/signature/signature-pad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PenLine, CheckCircle2 } from 'lucide-react';

interface AcceptProposalFormProps {
  token: string;
  onSuccess?: () => void;
}

export function AcceptProposalForm({ token, onSuccess }: AcceptProposalFormProps) {
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!signerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!signatureData) {
      setError('Please draw your signature above');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/proposals/accept-with-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signerName: signerName.trim(),
          signatureData,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit signature');
      }
      if (json.success) {
        setSuccess(true);
        onSuccess?.();
      } else {
        throw new Error(json.error || 'Failed to submit');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-800">Proposal Accepted</h3>
        <p className="text-green-700 mt-1 text-sm">
          Thank you. Your electronic signature has been recorded. The provider will be notified.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <PenLine className="h-5 w-5" />
          Sign to Accept
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Draw your signature below and enter your full legal name. By signing, you agree to the terms in this proposal.
        </p>

        <div className="mb-4">
          <Label htmlFor="signerName">Full legal name (printed)</Label>
          <Input
            id="signerName"
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="John Smith"
            className="mt-1 max-w-sm"
            required
            disabled={loading}
          />
        </div>

        <div>
          <Label>Your signature</Label>
          <p className="text-xs text-slate-500 mb-2">Draw in the box below using your mouse or finger</p>
          <SignaturePad
            onSignatureChange={setSignatureData}
            width={380}
            height={120}
            className="mb-2"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !signatureData || !signerName.trim()}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? 'Submitting...' : 'Accept & Sign Proposal'}
      </Button>
    </form>
  );
}
