import { requireOrg } from '@/lib/auth';
import { BidCalculator } from '@/components/bids/bid-calculator';

export default async function NewBidPage() {
  await requireOrg();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Bid</h1>
        <p className="text-gray-600 mt-1">Calculate fair market value for cleaning services</p>
      </div>
      <BidCalculator />
    </div>
  );
}
