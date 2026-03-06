'use client';

import { X, Phone, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { MapEntity } from '@/types/territory-map';

interface Props {
  entity: MapEntity;
  orgId: string;
  onClose: () => void;
}

export function EntityDrawer({ entity, orgId, onClose }: Props) {
  const meta = entity.meta ?? {};
  const isLead = entity.type === 'lead';
  const isAccount = entity.type === 'account';

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{entity.type}</p>
          <h2 className="mt-0.5 truncate text-base font-semibold text-foreground">{entity.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 p-4">
        {isLead && (
          <>
            {meta.contact && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Contact</p>
                <p className="text-sm text-foreground">{String(meta.contact)}</p>
              </div>
            )}
            {meta.status && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="text-sm text-foreground">{String(meta.status)}</p>
              </div>
            )}
            {meta.score != null && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Score</p>
                <p className="text-sm text-foreground">{String(meta.score)}</p>
              </div>
            )}
            {(meta.vertical_label ?? meta.vertical_id) && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vertical</p>
                <p className="text-sm text-foreground">
                  {String(meta.vertical_label ?? meta.vertical_id)}
                  {meta.vertical_confidence != null && (
                    <span className="ml-1 text-muted-foreground">({Number(meta.vertical_confidence)}%)</span>
                  )}
                </p>
                {meta.vertical_source && (
                  <p className="text-xs text-muted-foreground">Source: {String(meta.vertical_source)}</p>
                )}
                <Link
                  href={`/app/sales/leads/${entity.id}`}
                  className="mt-1 inline-block text-xs text-primary hover:underline"
                >
                  Change vertical →
                </Link>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/app/sales/leads/${entity.id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Lead
              </Link>
              {meta.phone && (
                <a
                  href={`tel:${String(meta.phone)}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              )}
              {meta.email && (
                <a
                  href={`mailto:${String(meta.email)}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              )}
            </div>
          </>
        )}
        {isAccount && (
          <>
            {meta.account_name && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Customer</p>
                <p className="text-sm text-foreground">{String(meta.account_name)}</p>
              </div>
            )}
            {meta.assigned_crew && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Assigned crew</p>
                <p className="text-sm text-foreground">{String(meta.assigned_crew)}</p>
              </div>
            )}
            {meta.last_service && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Last service</p>
                <p className="text-sm text-foreground">{String(meta.last_service)}</p>
              </div>
            )}
            <div className="pt-2">
              <Link
                href={`/app/sites/${entity.id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View site
              </Link>
            </div>
          </>
        )}
        {(entity.type === 'crew' || entity.type === 'franchisee') && (
          <div className="text-sm text-muted-foreground">
            <Link href={`/app/crews/${entity.id}`} className="text-primary hover:underline">
              View details
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
