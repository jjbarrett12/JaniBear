import { requireOrg } from '@/lib/auth';
import { NewConversationForm } from '@/components/messages/new-conversation-form';

export default async function NewMessagePage() {
  const org = await requireOrg();

  return (
    <div className="space-y-6">
      <NewConversationForm orgId={org.org_id} />
    </div>
  );
}
