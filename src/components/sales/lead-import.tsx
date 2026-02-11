'use client';

import { useState, useRef, useEffect } from 'react';

/** Minimal types for Web Speech API (not in TS lib) */
interface SpeechResultItem {
  [index: number]: { transcript: string };
  length: number;
}
interface SpeechResultEvent {
  results: Iterable<SpeechResultItem>;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Mic, Camera, Mail, Link2, Loader2 } from 'lucide-react';
import { MobileCameraUpload } from '@/components/mobile/mobile-camera-upload';

export type LeadImportSource = 'paste' | 'email' | 'text' | 'third_party' | 'voice' | 'scan';

export interface ParsedLead {
  contact_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  raw_text?: string;
}

const SOURCE_OPTIONS: { value: LeadImportSource; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'paste', label: 'Paste contact', icon: Copy, description: 'Paste contact info from text or email' },
  { value: 'email', label: 'Email / Text', icon: Mail, description: 'Enter contact details from email or SMS' },
  { value: 'voice', label: 'Speak it', icon: Mic, description: 'Dictate contact info into the system' },
  { value: 'scan', label: 'Scan with camera', icon: Camera, description: 'Scan a business card or document' },
  { value: 'third_party', label: '3rd party lead', icon: Link2, description: 'Import from CRM or lead provider' },
];

// Simple heuristic: try to parse name, email, phone from pasted text
function parsePastedText(text: string): ParsedLead {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  let contact_name = '';
  let company = '';
  if (lines.length >= 1) contact_name = lines[0];
  if (lines.length >= 2) company = lines[1];
  return {
    contact_name: contact_name || undefined,
    company: company || undefined,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    raw_text: text,
  };
}

interface LeadImportProps {
  onImport: (source: LeadImportSource, data: ParsedLead) => void;
  isLoading?: boolean;
}

export function LeadImport({ onImport, isLoading }: LeadImportProps) {
  const [activeSource, setActiveSource] = useState<LeadImportSource | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  type SpeechRecognitionInstance = { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: SpeechResultEvent) => void) | null; start: () => void; stop: () => void; abort: () => void };
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (e: SpeechResultEvent) => {
        const transcript = Array.from(e.results)
          .map((r) => (r as SpeechResultItem)[0]?.transcript ?? '')
          .join('');
        setPasteText(prev => prev + transcript);
      };
    }
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const handlePasteSubmit = () => {
    const parsed = parsePastedText(pasteText);
    onImport('paste', parsed);
  };

  const handleManualSubmit = () => {
    onImport('email', {
      contact_name: manualName || undefined,
      company: manualCompany || undefined,
      email: manualEmail || undefined,
      phone: manualPhone || undefined,
      address: manualAddress || undefined,
    });
  };

  const handleVoiceStart = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    setPasteText('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  const handleVoiceStop = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleVoiceSubmit = () => {
    handleVoiceStop();
    const parsed = parsePastedText(pasteText);
    onImport('voice', parsed);
  };

  const handleScanImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setScanImage(url);
  };

  const handleScanSubmit = () => {
    onImport('scan', { raw_text: 'Scanned document captured. Add OCR integration to extract contact details.' });
    if (scanImage) URL.revokeObjectURL(scanImage);
    setScanImage(null);
  };

  const handleThirdParty = () => {
    onImport('third_party', { raw_text: '3rd party lead – connect your CRM or lead provider in Settings.' });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SOURCE_OPTIONS.map(({ value, label, icon: Icon, description }) => (
          <Card
            key={value}
            className={`cursor-pointer transition-all ${
              activeSource === value ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-300'
            }`}
            onClick={() => setActiveSource(activeSource === value ? null : value)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{label}</CardTitle>
              </div>
              <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {activeSource === 'paste' && (
        <Card>
          <CardHeader>
            <CardTitle>Paste contact</CardTitle>
            <CardDescription>Paste contact info from an email, text, or document. We’ll try to detect name, email, and phone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste here: name, company, email, phone..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <Button onClick={handlePasteSubmit} disabled={isLoading || !pasteText.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Import from paste
            </Button>
          </CardContent>
        </Card>
      )}

      {activeSource === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle>Email / Text</CardTitle>
            <CardDescription>Enter contact details from an email or SMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Contact name" />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={manualCompany} onChange={(e) => setManualCompany(e.target.value)} placeholder="Company" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div>
              <Label>Address (optional)</Label>
              <Input value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} placeholder="Street, City, State ZIP" />
            </div>
            <Button onClick={handleManualSubmit} disabled={isLoading || (!manualName && !manualCompany && !manualEmail && !manualPhone)}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add lead
            </Button>
          </CardContent>
        </Card>
      )}

      {activeSource === 'voice' && (
        <Card>
          <CardHeader>
            <CardTitle>Speak it</CardTitle>
            <CardDescription>Dictate the contact info. Supported in Chrome and Edge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={isListening ? 'destructive' : 'default'}
                onClick={isListening ? handleVoiceStop : handleVoiceStart}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isListening ? 'Stop' : 'Start'} listening
              </Button>
              {pasteText && (
                <Button onClick={handleVoiceSubmit} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Import
                </Button>
              )}
            </div>
            {pasteText && (
              <Textarea readOnly value={pasteText} rows={4} className="bg-gray-50 font-mono text-sm" />
            )}
          </CardContent>
        </Card>
      )}

      {activeSource === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle>Scan with camera</CardTitle>
            <CardDescription>Take a photo of a business card or document. OCR can be added to extract text automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MobileCameraUpload
              onImageCapture={handleScanImage}
              currentImage={scanImage}
              onImageRemove={() => { if (scanImage) URL.revokeObjectURL(scanImage); setScanImage(null); }}
            />
            <p className="text-xs text-gray-500">After capture, import the lead. OCR can be added later to auto-extract contact details.</p>
            <Button onClick={handleScanSubmit} disabled={isLoading || !scanImage}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Import lead from scan
            </Button>
          </CardContent>
        </Card>
      )}

      {activeSource === 'third_party' && (
        <Card>
          <CardHeader>
            <CardTitle>3rd party lead</CardTitle>
            <CardDescription>Connect your CRM or lead provider in Settings to import leads automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleThirdParty} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add placeholder lead (connect CRM in Settings)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
