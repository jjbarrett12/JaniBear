'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  FileText, 
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ExtractedLocation {
  name: string;
  address?: string;
  square_footage?: number;
  service_days?: string[];
  service_time?: string;
  frequency?: string;
  special_requirements?: string;
}

interface ExtractedData {
  locations: ExtractedLocation[];
  total_square_footage?: number;
  total_visits_per_week?: number;
  summary?: string;
  missing_info?: string[];
}

interface ScheduleScannerProps {
  onDataExtracted: (data: ExtractedData) => void;
}

export function ScheduleScanner({ onDataExtracted }: ScheduleScannerProps) {
  const [documentText, setDocumentText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!documentText.trim()) {
      setError('Please paste your service schedule or contract text');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/scan-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          documentType: 'service schedule',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan document');
      }

      setResult(data.data);
      onDataExtracted(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan document');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            Service Schedule Scanner
          </CardTitle>
          <CardDescription>
            Paste your existing service schedule, contract, or route list and AI will extract the location and service details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentText">Document Text</Label>
            <Textarea
              id="documentText"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your service schedule, contract, or route list here...

Example:
Monday - Building A (123 Main St) - 10,000 sqft - Evening
Tuesday - Office Park B (456 Oak Ave) - 5,000 sqft - Morning
Wednesday - Building A, Medical Center (789 Health Blvd) - 15,000 sqft"
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              The AI will extract locations, addresses, square footage, service days, and other details
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button 
            onClick={handleScan} 
            disabled={isScanning || !documentText.trim()}
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Scan with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Extracted Data
            </CardTitle>
            {result.summary && (
              <CardDescription className="text-emerald-700">{result.summary}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-white rounded-lg p-3 border border-emerald-200">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{result.locations.length}</span> locations found
                </div>
              </div>
              {result.total_visits_per_week && (
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">{result.total_visits_per_week}</span> visits/week
                  </div>
                </div>
              )}
            </div>

            {/* Locations List */}
            <div className="space-y-2">
              <Label className="text-emerald-800">Locations</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.locations.map((location, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{location.name}</p>
                        {location.address && (
                          <p className="text-sm text-gray-500">{location.address}</p>
                        )}
                      </div>
                      {location.square_footage && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="h-3 w-3" />
                          {location.square_footage.toLocaleString()} sqft
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {location.frequency && <span>{location.frequency}</span>}
                      {location.service_time && <span className="capitalize">{location.service_time}</span>}
                      {location.service_days && location.service_days.length > 0 && (
                        <span>{location.service_days.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Info Warnings */}
            {result.missing_info && result.missing_info.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800 mb-1">Missing Information:</p>
                <ul className="text-sm text-amber-700 list-disc list-inside">
                  {result.missing_info.map((info, i) => (
                    <li key={i}>{info}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
