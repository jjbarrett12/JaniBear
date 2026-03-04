'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowRight, Check } from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Your organization is set up.' },
  { id: 'roles', title: 'Role template', description: 'Choose a default role template (optional).' },
  { id: 'invite', title: 'Invite team', description: 'Invite colleagues later from Team & access.' },
  { id: 'modules', title: 'Dashboards', description: 'Enable which dashboards your team sees.' },
  { id: 'finish', title: 'Finish', description: 'You\'re ready to go.' },
];

export function OnboardingWizard({
  orgId,
  orgName,
  initialStatus,
  initialModules,
}: {
  orgId: string;
  orgName: string;
  initialStatus: string;
  initialModules: { sales?: boolean; ops?: boolean; management?: boolean };
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [modules, setModules] = useState(initialModules);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleComplete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/onboarding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_status: 'completed',
          enabled_modules: modules,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to save');
        return;
      }
      setDone(true);
      window.location.href = '/app/dashboard';
    } finally {
      setSaving(false);
    }
  }

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ' / '}
              <span className={i === stepIndex ? 'text-foreground font-medium' : ''}>
                {s.title}
              </span>
            </span>
          ))}
        </div>
        <CardTitle className="text-2xl">{step.title}</CardTitle>
        <CardDescription>{step.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step.id === 'welcome' && (
          <p className="text-muted-foreground">
            <strong>{orgName || 'Your organization'}</strong> is ready. Complete the steps below
            to configure defaults and then go to your dashboard.
          </p>
        )}

        {step.id === 'modules' && (
          <div className="space-y-4">
            <Label>Enabled dashboards</Label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={modules.sales !== false}
                  onCheckedChange={(v) => setModules((m) => ({ ...m, sales: !!v }))}
                />
                <span>Sales (pipeline, proposals, CRM)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={modules.ops !== false}
                  onCheckedChange={(v) => setModules((m) => ({ ...m, ops: !!v }))}
                />
                <span>Operations (inspections, tasks, crews)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={modules.management !== false}
                  onCheckedChange={(v) => setModules((m) => ({ ...m, management: !!v }))}
                />
                <span>Management (reporting, dashboards)</span>
              </label>
            </div>
          </div>
        )}

        {step.id === 'finish' && (
          <p className="text-muted-foreground">
            You can invite team members and change settings anytime from{' '}
            <strong>Admin → Team & access</strong> or <strong>Settings → Team</strong>.
          </p>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="ghost"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
          >
            Back
          </Button>
          {isLast ? (
            <Button onClick={handleComplete} disabled={saving}>
              {saving || done ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span className="ml-2">{done ? 'Redirecting…' : 'Finish and go to dashboard'}</span>
            </Button>
          ) : (
            <Button onClick={() => setStepIndex((i) => i + 1)}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
