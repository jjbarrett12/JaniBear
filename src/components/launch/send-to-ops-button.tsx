'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { sendLaunchPacketToOps } from '@/actions/launch-packet';
import { Send } from 'lucide-react';
import { AppErrorBlock } from '@/components/app/app-error-block';

export function SendToOpsButton({ packetId }: { packetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    const result = await sendLaunchPacketToOps(packetId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
    router.push(`/app/ops/launch-intake?highlight=${encodeURIComponent(packetId)}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleSend} disabled={loading} className="gap-2">
        <Send className="h-4 w-4" />
        {loading ? 'Sending…' : 'Submit to Operations'}
      </Button>
      {error && (
        <AppErrorBlock
          title="Couldn't send to Operations"
          message={error}
          recovery="Check your connection and try again."
          onRetry={() => setError(null)}
          retryLabel="Try again"
        />
      )}
    </div>
  );
}
