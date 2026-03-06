'use client';

import { X, Phone, Mail, ExternalLink, UserPlus, Building2, Calendar, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import type { MapEntity } from '@/types/territory-map';
import type { FacilityWithHealth } from '@/types/territory-map';

interface Props {
  entity: MapEntity | null;
  facility?: FacilityWithHealth | null;
  orgId: string;
  onClose: () => void;
}

export function MapIntelDrawer({ entity, facility, orgId, onClose }: Props) {
  if (!entity) return null;

  const meta = entity.meta ?? {};
  const isLead = entity.type === 'lead';
  const isAccount = entity.type === 'account';
  const scoreReasons = (meta.score_reasons as string[]) ?? [];
  const status = (meta.status as string) ?? 'new';

  return (
    <aside className="flex w-full max-w-[90vw] sm:max-w-md sm:w-80 shrink-0 flex-col border-l border-white/10 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
      <div className="flex items-start justify-between border-b border-white/10 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{entity.type}</p>
          <h2 className="mt-0.5 truncate text-lg font-semibold text-white">{entity.name}</h2>
          {isLead && (
            <span className="mt-1 inline-block rounded bg-white/10 px-2 py-0.5 text-xs text-zinc-400">Source</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLead && (
          <>
            {meta.contact && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Contact</p>
                <p className="text-sm text-white">{String(meta.contact)}</p>
                <div className="mt-1.5 flex gap-2">
                  {meta.phone && (
                    <a href={`tel:${String(meta.phone)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  )}
                  {meta.email && (
                    <a href={`mailto:${String(meta.email)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 px-2 py-1 text-sm font-semibold text-amber-300">{meta.score ?? 50}</span>
              <select
                defaultValue={status}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="closed_won">Won</option>
                <option value="closed_lost">Lost</option>
              </select>
            </div>
            {scoreReasons.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">Why this?</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-zinc-400">
                  {scoreReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              <Link
                href={`/app/sales/leads/${entity.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/30"
              >
                <ExternalLink className="h-4 w-4" /> Open Lead
              </Link>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10">
                <UserPlus className="h-4 w-4" /> Enrich
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10">
                Convert to Account
              </button>
            </div>
          </>
        )}

        {isAccount && (
          <>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-sm font-medium ${
                facility?.health_status === 'red' ? 'bg-red-500/20 text-red-300' :
                facility?.health_status === 'yellow' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {facility?.health_status ?? 'Active'}
              </span>
            </div>
            {meta.assigned_crew && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Assigned crew</p>
                <p className="text-sm text-white">{String(meta.assigned_crew)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Last inspection</p>
              <p className="text-sm text-zinc-400">
                {facility?.last_inspection_at
                  ? new Date(facility.last_inspection_at).toLocaleDateString()
                  : facility?.last_inspection_score != null
                    ? `Score: ${facility.last_inspection_score}`
                    : '—'}
              </p>
            </div>
            {facility && (facility.overdue_ticket_count > 0 || facility.missed_shifts_7d > 0) && (
              <p className="text-xs text-amber-300">
                {facility.overdue_ticket_count > 0 && `${facility.overdue_ticket_count} overdue`}
                {facility.missed_shifts_7d > 0 && ` · ${facility.missed_shifts_7d} missed (7d)`}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              <Link
                href={`/app/sites/${entity.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 px-3 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/30"
              >
                <Building2 className="h-4 w-4" /> Open Account
              </Link>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10">
                Reassign
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10">
                <Calendar className="h-4 w-4" /> Schedule Visit
              </button>
            </div>
          </>
        )}

        {(entity.type === 'crew' || entity.type === 'franchisee') && (
          <div className="space-y-2">
            <Link
              href={entity.type === 'crew' ? `/app/crews/${entity.id}` : '#'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <ClipboardCheck className="h-4 w-4" /> View details
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
