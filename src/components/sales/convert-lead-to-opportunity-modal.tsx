'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { convertLeadToOpportunity } from '@/actions/leads';
import { TrendingUp, X } from 'lucide-react';

const STAGES = [
  { value: 'qualified', label: 'Qualified' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'walkthrough', label: 'Walkthrough' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'verbal_yes', label: 'Verbal Yes' },
];

type AccountOption = { id: string; name: string };

export function ConvertLeadToOpportunityModal({
  leadId,
  defaultAccountName,
  accounts,
}: {
  leadId: string;
  defaultAccountName: string;
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useNewAccount, setUseNewAccount] = useState(true);
  const [accountId, setAccountId] = useState<string>('');
  const [accountName, setAccountName] = useState(defaultAccountName);
  const [stage, setStage] = useState('qualified');
  const [expectedValue, setExpectedValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await convertLeadToOpportunity({
      leadId,
      accountId: useNewAccount ? undefined : accountId || undefined,
      createNewAccount: useNewAccount,
      accountName: useNewAccount ? accountName : undefined,
      stage,
      expectedValueCents: expectedValue ? Math.round(parseFloat(expectedValue) * 100) : null,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.push(`/app/kpis?tab=pipeline&highlight=${encodeURIComponent(result.opportunityId)}`);
  };

  return (
    <>
      <Button
        type="button"
        variant="default"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <TrendingUp className="h-4 w-4" />
        Convert to Opportunity
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="convert-dialog-title"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle id="convert-dialog-title">Convert to Opportunity</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create or link an Account (prospect) and add this lead to the Pipeline.
                </p>
                <div className="grid gap-2">
                  <Label>Account</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={useNewAccount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUseNewAccount(true)}
                    >
                      New
                    </Button>
                    <Button
                      type="button"
                      variant={!useNewAccount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUseNewAccount(false)}
                    >
                      Existing
                    </Button>
                  </div>
                  {useNewAccount ? (
                    <Input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Account name"
                      required
                    />
                  ) : (
                    <Select value={accountId} onValueChange={setAccountId} required={!useNewAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Initial stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expected-value">Expected value (optional)</Label>
                  <Input
                    id="expected-value"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Converting…' : 'Convert & open in Pipeline'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
