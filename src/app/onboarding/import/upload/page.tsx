import { ImportUploadClient } from '@/components/onboarding-import/ImportUploadClient';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, ClipboardList, Rocket } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STEPS = [
  { icon: Upload, label: 'Upload Spreadsheet', description: 'Drop your file and we’ll read it securely.' },
  { icon: ClipboardList, label: 'Review Detected Data', description: 'See what we found and confirm the mapping.' },
  { icon: Rocket, label: 'Import Your Business', description: 'One click and you’re set up.' },
];

export default function ImportUploadPage() {
  return (
    <div className="space-y-14">
      <header className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Import your business into JANIBEAR
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Upload your spreadsheet and we’ll map it to your accounts and locations in minutes.
        </p>
        <p className="text-sm text-slate-500">
          Works with CSV, Excel, or exports from Swept, Jobber, or ZenMaid.
        </p>
      </header>

      <div className="flex justify-center">
        <ImportUploadClient />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
        {STEPS.map(({ icon: Icon, label, description }) => (
          <Card
            key={label}
            className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
