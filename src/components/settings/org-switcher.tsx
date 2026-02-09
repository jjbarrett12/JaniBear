'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';

type OrgType = 'franchisor' | 'franchisee' | 'independent';

type Org = { id: string; name: string; org_type: OrgType };

export function OrgSwitcher({
  currentOrgId,
  onSwitch,
}: {
  currentOrgId: string | null;
  onSwitch?: () => void;
}) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    async function fetchOrgs() {
      const res = await fetch('/api/org/list');
      if (!res.ok) return;
      const data = await res.json();
      setOrgs(data.orgs ?? []);
      setLoading(false);
    }
    fetchOrgs();
  }, []);

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrgId) return;
    setSwitching(true);
    try {
      const res = await fetch('/api/org/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      });
      if (res.ok) {
        onSwitch?.();
        window.location.reload(); // So server sees new cookie and layout/context update
      }
    } finally {
      setSwitching(false);
    }
  };

  const label = (org_type: string) => {
    switch (org_type) {
      case 'franchisor':
        return 'Franchisor';
      case 'franchisee':
        return 'Franchisee';
      case 'independent':
        return 'Independent';
      default:
        return org_type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading organizations…
      </div>
    );
  }

  if (orgs.length <= 1) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          You have one organization. To test <strong>Franchisor</strong>, <strong>Franchisee</strong>, and{' '}
          <strong>Independent</strong> experiences, add yourself to test orgs of each type. See{' '}
          <code className="rounded bg-muted px-1 text-xs">TESTING_ORG_TYPES.md</code> for the SQL script.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Active organization (for testing Franchisor / Franchisee / Independent)
      </Label>
      <Select
        value={currentOrgId ?? undefined}
        onValueChange={handleSwitch}
        disabled={switching}
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {orgs.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name} <span className="text-muted-foreground">({label(org.org_type)})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {switching && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Switching…
        </p>
      )}
    </div>
  );
}
