import { createClient } from '@/lib/supabase/server';
import { getServerContextOrThrow } from '@/lib/auth/serverGuards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CreditCard, AlertTriangle } from 'lucide-react';
import { BillingClient } from './billing-client';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const ctx = await getServerContextOrThrow();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, billing_status, past_due_since, locked_since, stripe_customer_id')
    .eq('id', ctx.orgId)
    .single();

  const { data: recentEvents } = await supabase
    .from('org_billing_events')
    .select('id, type, payload, created_at')
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!org) {
    return (
      <div className="p-6">
        <p>Organization not found.</p>
      </div>
    );
  }

  const isPastDue = org.billing_status === 'past_due';
  const isLocked = !!org.locked_since;
  const isCanceled = org.billing_status === 'canceled';
  const hasPaymentMethod = !!org.stripe_customer_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Update payment method and view billing status.
          </p>
        </div>
      </div>

      {(isPastDue || isLocked || isCanceled) && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              {isCanceled && 'Subscription canceled'}
              {isLocked && !isCanceled && 'Account locked — payment overdue'}
              {isPastDue && !isLocked && 'Payment past due'}
            </CardTitle>
            <CardDescription>
              {isCanceled && 'Your subscription has been canceled. Resubscribe from onboarding.'}
              {isLocked && !isCanceled && 'Update your payment method to restore access.'}
              {isPastDue && !isLocked && 'Please update your payment method to avoid service interruption.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment method
          </CardTitle>
          <CardDescription>
            Status: <strong>{org.billing_status}</strong>
            {org.past_due_since && ` — Past due since ${new Date(org.past_due_since).toLocaleDateString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingClient
            orgId={org.id}
            hasCustomer={hasPaymentMethod}
            isLocked={isLocked}
            isCanceled={isCanceled}
          />
        </CardContent>
      </Card>

      {recentEvents && recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent billing events</CardTitle>
            <CardDescription>Card expiring, payment failed, or other notices.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentEvents.map((e) => (
                <li key={e.id}>
                  <span className="font-medium">{e.type}</span>
                  {' — '}
                  <span className="text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
