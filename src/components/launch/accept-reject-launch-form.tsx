'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { acceptLaunchPacket, rejectLaunchPacket } from '@/actions/launch-packet';
import { CheckCircle2, XCircle } from 'lucide-react';

export function AcceptRejectLaunchForm({ packetId }: { packetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading('accept');
    setError(null);
    const result = await acceptLaunchPacket(packetId);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.refresh();
    router.push('/app/ops/launch-intake');
    setLoading(null);
  };

  const handleReject = async () => {
    setLoading('reject');
    setError(null);
    const result = await rejectLaunchPacket(packetId, rejectReason);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.refresh();
    router.push('/app/ops/launch-intake');
    setLoading(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold">Actions</h3>
      <div className="flex flex-wrap gap-3 items-end">
        <Button
          onClick={handleAccept}
          disabled={loading !== null}
          variant="default"
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {loading === 'accept' ? 'Accepting…' : 'Accept Intake'}
        </Button>
        <div className="flex flex-col gap-1">
          <Textarea
            placeholder="Reason for requesting changes (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
            className="max-w-md"
          />
          <Button
            onClick={handleReject}
            disabled={loading !== null}
            variant="destructive"
            className="gap-2 self-start"
          >
            <XCircle className="h-4 w-4" />
            {loading === 'reject' ? 'Sending…' : 'Request Changes'}
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
