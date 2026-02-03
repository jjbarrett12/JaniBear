import { requireOrg, getCurrentUser } from '@/lib/auth';
import { WalkthroughForm } from '@/components/walkthroughs/walkthrough-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'New Walkthrough | JANIBEAR',
};

export default async function NewWalkthroughPage() {
  const org = await requireOrg();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/app/walkthroughs" 
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Walkthrough</h1>
          <p className="text-gray-500">
            Capture all the details needed to generate a proposal
          </p>
        </div>
      </div>

      <WalkthroughForm 
        orgId={org.org_id} 
        userId={user.id}
        userName={user.user_metadata?.full_name}
      />
    </div>
  );
}
