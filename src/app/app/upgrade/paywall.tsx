'use client';

import { useState, type ComponentType } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  ScanLine,
  Cpu,
  Zap,
  Check,
  Loader2,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  QrCode,
  Scan: ScanLine,
  Cpu,
  Zap,
};

export type PaywallModuleData = {
  key: string;
  name: string;
  description: string;
  descriptionBullets: string[];
  priceDisplay: string;
  primaryCtaLabel: string;
  icon: string;
};

interface PaywallProps {
  module: PaywallModuleData;
  orgId: string;
  canUpgrade: boolean;
  isEnabled: boolean;
  fromPath: string | null;
}

const REQUEST_MESSAGE = `Hi — could you add the module to our plan? I don’t have billing access. Thanks!`;

export function Paywall({
  module,
  orgId,
  canUpgrade,
  isEnabled,
  fromPath,
}: PaywallProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const IconComponent = ICON_MAP[module.icon] ?? QrCode;
  const successFrom = fromPath && fromPath.startsWith('/app/') ? fromPath : '/app/dashboard';
  const successUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/app/upgrade/success?module=${encodeURIComponent(module.key)}&from=${encodeURIComponent(successFrom)}`;

  const handleAddToPlan = async () => {
    if (!canUpgrade || isEnabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          return_url: successUrl,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to open billing');
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No portal URL returned');
    } catch (e) {
      console.error('Portal error:', e);
      setLoading(false);
      alert(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  };

  const handleCopyRequest = async () => {
    try {
      await navigator.clipboard.writeText(REQUEST_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy. Please copy the message manually.');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-card border border-border rounded-2xl shadow-xl overflow-hidden',
        'w-full max-w-lg mx-auto',
        'md:max-h-[90vh] md:overflow-y-auto'
     )}
    >
      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground">{module.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{module.description}</p>
          </div>
        </div>

        {isEnabled ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Included in your plan</span>
          </div>
        ) : (
          <>
            <div>
              <p className="text-2xl font-semibold text-foreground">{module.priceDisplay}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                per company / month (billed with your subscription)
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">What you get</p>
              <ul className="space-y-2" role="list">
                {module.descriptionBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {canUpgrade ? (
              <Button
                onClick={handleAddToPlan}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening…
                  </>
                ) : (
                  module.primaryCtaLabel
                )}
              </Button>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Only billing managers can add modules. Ask an owner or admin to upgrade for your organization.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRequest}
                  className="w-full sm:w-auto"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy request message
                    </>
                  )}
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <Link href="/contact" className="underline hover:no-underline">
                Need invoicing?
              </Link>
              {' · '}
              Contact support for annual billing or custom terms.
            </p>
          </>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          <Link href="/app/billing" className="text-xs text-muted-foreground underline hover:no-underline">
            Back to Billing
          </Link>
          {fromPath && (
            <Link href={fromPath} className="text-xs text-muted-foreground underline hover:no-underline">
              Return to previous page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
