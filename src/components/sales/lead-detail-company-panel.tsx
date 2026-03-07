'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Ruler, MapPin, Users, Briefcase, Globe } from 'lucide-react';

type Lead = {
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  website?: string | null;
  estimated_sq_ft?: number | null;
  estimated_locations?: number | null;
  employee_count?: number | null;
  current_cleaning_provider?: string | null;
  enrichment_status?: string | null;
};

export function LeadDetailCompanyPanel({ lead }: { lead: Lead }) {
  const hasAny =
    lead.estimated_sq_ft != null ||
    lead.estimated_locations != null ||
    lead.employee_count != null ||
    lead.current_cleaning_provider ||
    lead.website ||
    lead.address ||
    lead.city;

  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Company / Building
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(lead.address || lead.city) && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>{[lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
              {lead.website}
            </a>
          </div>
        )}
        {lead.estimated_sq_ft != null && lead.estimated_sq_ft > 0 && (
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span>{lead.estimated_sq_ft.toLocaleString()} sq ft</span>
          </div>
        )}
        {lead.estimated_locations != null && lead.estimated_locations > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{lead.estimated_locations} location{lead.estimated_locations !== 1 ? 's' : ''}</span>
          </div>
        )}
        {lead.employee_count != null && lead.employee_count > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{lead.employee_count} employees</span>
          </div>
        )}
        {lead.current_cleaning_provider && (
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>Current provider: {lead.current_cleaning_provider}</span>
          </div>
        )}
        {lead.enrichment_status && (
          <p className="text-xs text-muted-foreground pt-1 border-t">Enrichment: {lead.enrichment_status}</p>
        )}
      </CardContent>
    </Card>
  );
}
