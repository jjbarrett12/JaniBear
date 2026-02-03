'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, Sparkles } from 'lucide-react';
import { ScheduleScanner } from '@/components/schedules/schedule-scanner';
import { CrewSplitter } from '@/components/schedules/crew-splitter';

interface ExtractedLocation {
  name: string;
  address?: string;
  square_footage?: number;
  service_days?: string[];
  service_time?: string;
  frequency?: string;
  special_requirements?: string;
}

export default function ScheduleScannerPage() {
  const [extractedLocations, setExtractedLocations] = useState<ExtractedLocation[]>([]);
  const [step, setStep] = useState<'scan' | 'split'>('scan');

  const handleDataExtracted = (data: { locations: ExtractedLocation[] }) => {
    setExtractedLocations(data.locations);
    if (data.locations.length > 0) {
      setStep('split');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/app/schedules" 
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            AI Schedule Scanner
          </h1>
          <p className="text-gray-500">
            Scan existing schedules and split across crews with AI
          </p>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <Button
          variant={step === 'scan' ? 'default' : 'outline'}
          onClick={() => setStep('scan')}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          1. Scan Document
        </Button>
        <Button
          variant={step === 'split' ? 'default' : 'outline'}
          onClick={() => setStep('split')}
          disabled={extractedLocations.length === 0}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          2. Split Crews
          {extractedLocations.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
              {extractedLocations.length}
            </span>
          )}
        </Button>
      </div>

      {/* Content */}
      {step === 'scan' && (
        <ScheduleScanner onDataExtracted={handleDataExtracted} />
      )}

      {step === 'split' && (
        <CrewSplitter locations={extractedLocations} />
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
        <h3 className="font-semibold text-orange-900 mb-2">Tips for Best Results</h3>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Include location names, addresses, and square footage when possible</li>
          <li>• Specify service days (e.g., &quot;Mon/Wed/Fri&quot; or &quot;3x per week&quot;)</li>
          <li>• Include any special requirements or notes for each location</li>
          <li>• The AI works best with structured data but can handle free-form text</li>
        </ul>
      </div>
    </div>
  );
}
