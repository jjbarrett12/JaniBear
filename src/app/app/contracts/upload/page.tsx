import { requireOrg } from '@/lib/auth';
import { ContractUploadForm } from '@/components/contracts/contract-upload-form';

export default async function UploadContractPage() {
  await requireOrg();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Upload Contract</h1>
        <p className="text-gray-600 mt-1">Upload a service schedule or contract</p>
      </div>
      <ContractUploadForm />
    </div>
  );
}
