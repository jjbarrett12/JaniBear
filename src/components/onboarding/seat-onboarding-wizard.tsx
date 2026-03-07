'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/billing/pricing';
import { AppErrorBlock } from '@/components/app/app-error-block';

const STEPS = [
  { id: 1, title: 'Organization', short: 'Org' },
  { id: 2, title: 'Seat setup', short: 'Seats' },
  { id: 3, title: 'Price summary', short: 'Price' },
  { id: 4, title: 'Payment', short: 'Payment' },
  { id: 5, title: 'Done', short: 'Done' },
];

const SEAT_LABELS: Record<string, string> = {
  cub: 'Cub (crew)',
  super_cub: 'Super-Cub (crew supervisor)',
  grizzly: 'Grizzly (sales rep)',
  super_grizzly: 'Super-Grizzly (sales manager)',
  kodiak: 'Kodiak (ops manager)',
  super_kodiak: 'Super-Kodiak (owner / senior ops)',
};

const SEAT_KEYS = ['cub', 'super_cub', 'grizzly', 'super_grizzly', 'kodiak', 'super_kodiak'] as const;

type SeatCounts = Record<(typeof SEAT_KEYS)[number], number>;

const defaultCounts: SeatCounts = {
  cub: 0,
  super_cub: 0,
  grizzly: 0,
  super_grizzly: 0,
  kodiak: 0,
  super_kodiak: 0,
};

export function SeatOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [counts, setCounts] = useState<SeatCounts>(defaultCounts);
  const [lidarTier, setLidarTier] = useState<'none' | 'starter' | 'unlimited'>('none');
  const [monthlyTotalCents, setMonthlyTotalCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 3 || !orgId) return;
    const body = {
      ...counts,
      cub_count: counts.cub,
      super_cub_count: counts.super_cub,
      grizzly_count: counts.grizzly,
      super_grizzly_count: counts.super_grizzly,
      kodiak_count: counts.kodiak,
      super_kodiak_count: counts.super_kodiak,
      lidar_tier: lidarTier,
    };
    fetch('/api/org/seats/preview-total', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => setMonthlyTotalCents(data.monthly_total_cents ?? 0))
      .catch(() => setMonthlyTotalCents(0));
  }, [step, orgId, counts, lidarTier]);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create organization');
      setOrgId(data.org_id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          cub_count: counts.cub,
          super_cub_count: counts.super_cub,
          grizzly_count: counts.grizzly,
          super_grizzly_count: counts.super_grizzly,
          kodiak_count: counts.kodiak,
          super_kodiak_count: counts.super_kodiak,
          lidar_tier: lidarTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout');
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.sessionId) {
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  const totalSeats =
    counts.cub +
    counts.super_cub +
    counts.grizzly +
    counts.super_grizzly +
    counts.kodiak +
    counts.super_kodiak;
  const progress = (step / STEPS.length) * 100;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {step} of {STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={`text-xs ${s.id <= step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              {s.short}
            </span>
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Create your organization</CardTitle>
            <CardDescription>
              Enter your organization name. You will be set as the owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Cleaning"
                  required
                  disabled={loading}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Your name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  disabled={loading}
                  className="bg-white/5 border-white/10"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create & continue
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Seat setup</CardTitle>
            <CardDescription>
              Choose how many seats you need for each role. Add-on: LiDAR tier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {SEAT_KEYS.map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label className="flex-1">{SEAT_LABELS[key]}</Label>
                <Input
                  type="number"
                  min={0}
                  value={counts[key]}
                  onChange={(e) =>
                    setCounts((c) => ({ ...c, [key]: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                  }
                  className="w-20 bg-white/5 border-white/10"
                />
              </div>
            ))}
            <div className="pt-2 border-t border-white/10">
              <Label className="mb-2 block">LiDAR add-on</Label>
              <Select value={lidarTier} onValueChange={(v: 'none' | 'starter' | 'unlimited') => setLidarTier(v)}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep(1)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={totalSeats === 0 && lidarTier === 'none'}>
                Continue to price
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Monthly price</CardTitle>
            <CardDescription>
              Your total per month. You can change seats later from Team & Billing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">
              {monthlyTotalCents != null ? formatPrice(monthlyTotalCents) : '—'}
            </p>
            <p className="text-sm text-muted-foreground">per month</p>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep(2)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={monthlyTotalCents == null || monthlyTotalCents <= 0}>
                Continue to payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>
              You will be redirected to Stripe to add a payment method and start your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">
              {monthlyTotalCents != null ? formatPrice(monthlyTotalCents) : '—'} / month
            </p>
            {error && (
              <AppErrorBlock
                title="Checkout couldn't start"
                message={error}
                recovery="Check your connection and try again. If it persists, contact support."
                onRetry={() => setError(null)}
                retryLabel="Dismiss"
              />
            )}
            <div className="flex gap-3">
              <Button onClick={() => setStep(3)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleCheckout} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Go to payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>You&apos;re all set</CardTitle>
            <CardDescription>
              Redirecting you to the dashboard…
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/app/dashboard')}>
              Go to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
