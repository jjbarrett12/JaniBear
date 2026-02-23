'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, Shield, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Click Connect below', detail: 'We’ll open QuickBooks in a new step.' },
  { id: 2, label: 'Sign in and approve', detail: 'Use your QuickBooks account and allow read access to your company.' },
  { id: 3, label: "You're done", detail: 'We’ll sync your accounting data so numbers stay in one place.' },
];

interface ConnectQuickBooksOnboardingProps {
  /** Call when user clicks Connect — e.g. redirect to /api/integrations/quickbooks/connect */
  onConnect: () => void;
  /** True while starting the flow (navigating away) */
  isConnecting?: boolean;
}

/**
 * Simple, low-friction QuickBooks connection onboarding.
 * One primary CTA; three short steps so the user knows exactly what will happen.
 */
export function ConnectQuickBooksOnboarding({ onConnect, isConnecting = false }: ConnectQuickBooksOnboardingProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Connect QuickBooks</CardTitle>
            <CardDescription>
              Sync your books with JaniBear so Financial Health uses your real accounting data.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step.id} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-xs font-medium text-primary">
                {step.id}
              </span>
              <div>
                <p className="font-medium text-foreground">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onConnect} disabled={isConnecting} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isConnecting ? 'Opening QuickBooks…' : 'Connect to QuickBooks'}
          </Button>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            We only request access to read your company data. You can disconnect anytime in settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
