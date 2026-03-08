'use client';

import { useRouter } from 'next/navigation';
import { AiRecommendedAssignmentCard } from './ai-recommended-assignment-card';
import { AcceptRejectLaunchForm } from './accept-reject-launch-form';
import { acceptLaunchPacket } from '@/actions/launch-packet';

export function LaunchIntakeActions({ packetId }: { packetId: string }) {
  const router = useRouter();

  const handleAcceptWithCrew = async (crewId: string) => {
    const result = await acceptLaunchPacket(packetId, { initialCrewId: crewId });
    if (result.error) throw new Error(result.error);
    router.refresh();
    router.push('/app/ops/launch-intake');
  };

  return (
    <div className="space-y-6">
      <AiRecommendedAssignmentCard packetId={packetId} onAcceptWithCrew={handleAcceptWithCrew} />
      <AcceptRejectLaunchForm packetId={packetId} />
    </div>
  );
}
