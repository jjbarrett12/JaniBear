'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { Check, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { ASSIGNABLE_ROLES } from '@/lib/team-roles';

const STEPS = [
  { id: 1, title: 'Create organization', short: 'Org' },
  { id: 2, title: 'Choose template', short: 'Template' },
  { id: 3, title: 'Invite team', short: 'Invite' },
  { id: 4, title: 'Enable modules', short: 'Modules' },
  { id: 5, title: "You're set", short: 'Done' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales_rep: 'Sales rep',
  sales: 'Sales',
  ops: 'Operations',
  inspector: 'Inspector',
  cleaner: 'Cleaner',
  client_viewer: 'Client viewer',
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'independent' | 'franchisee' | 'franchisor'>('independent');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState(ASSIGNABLE_ROLES[0] ?? 'sales');
  const [salesEnabled, setSalesEnabled] = useState(true);
  const [opsEnabled, setOpsEnabled] = useState(true);
  const [progressSaved, setProgressSaved] = useState(false);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }
    try {
      const { error: profileErr } = await supabase.from('profiles').upsert(
        { id: user.id, full_name: fullName || null },
        { onConflict: 'id' }
      );
      if (profileErr) throw profileErr;

      const { data: orgIdFromRpc, error: rpcErr } = await supabase.rpc('create_org_for_signup', {
        org_name: orgName,
        owner_user_id: user.id,
      });

      if (!rpcErr && orgIdFromRpc) {
        setProgressSaved(true);
        setStep(2);
        setLoading(false);
        return;
      }

      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: orgName, org_type: orgType })
        .select()
        .single();
      if (orgErr) throw orgErr;

      const { error: memberErr } = await supabase.from('org_members').insert({
        org_id: org.id,
        user_id: user.id,
        role: 'owner',
      });
      if (memberErr) throw memberErr;

      setProgressSaved(true);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    router.push('/auth/set-org-and-continue?next=/app/dashboard');
  }

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {step} of {STEPS.length}</span>
          {progressSaved && <span className="text-emerald-400">Progress saved</span>}
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
              Give your organization a name. You can change this later in settings.
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
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create & continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Choose a template</CardTitle>
            <CardDescription>
              Start with a preset that matches how you work. You can customize later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {['Sales-first', 'Ops-first', 'Full platform'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 text-left hover:border-white/20 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(3)}>Continue</Button>
              <Button variant="ghost" onClick={() => setStep(3)}>Skip</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Invite your team</CardTitle>
            <CardDescription>
              Add teammates by email. They’ll get an invite link. You can do this later from Admin → Invites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Emails (one per line)</Label>
              <Textarea
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="colleague@company.com"
                className="min-h-[100px] bg-white/5 border-white/10 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Default role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(4)}>Continue</Button>
              <Button variant="ghost" onClick={() => setStep(4)}>Skip</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Enable modules</CardTitle>
            <CardDescription>
              Turn on Sales, Operations, or both. You can change this in settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
              <span>Sales</span>
              <Button
                variant={salesEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSalesEnabled(!salesEnabled)}
              >
                {salesEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 p-4">
              <span>Operations</span>
              <Button
                variant={opsEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOpsEnabled(!opsEnabled)}
              >
                {opsEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(5)}>Continue</Button>
              <Button variant="ghost" onClick={() => setStep(5)}>Skip</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-400" />
              You’re all set
            </CardTitle>
            <CardDescription>
              Your organization is ready. You’ll be taken to your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDone} size="lg">
              Go to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step > 1 && step < 5 && (
        <div className="flex justify-start">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
