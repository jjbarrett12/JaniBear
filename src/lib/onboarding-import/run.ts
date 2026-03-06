/**
 * Execute import: create accounts, facilities, optionally crews; record each row in import_batch_items for rollback.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeForDedupe } from './normalize';
import { parseServiceSchedule } from './service-schedule';

export type ConfirmedMapping = Record<string, string>;

export interface RunImportInput {
  supabase: SupabaseClient;
  orgId: string;
  batchId: string;
  rows: Record<string, string>[];
  mapping: ConfirmedMapping;
  /** If set, only import these row indices (0-based). Used for "import ready rows only". */
  includeRowIndices?: number[];
}

export interface RunImportResult {
  accountsCreated: number;
  accountsSkipped: number;
  facilitiesCreated: number;
  facilitiesSkipped: number;
  crewsCreated: number;
  crewsSkipped: number;
  error?: string;
}

function getVal(row: Record<string, string>, mapping: ConfirmedMapping, field: string): string {
  const col = mapping[field];
  return (col ? row[col] : row[field])?.trim() ?? '';
}

/**
 * Run import in order: accounts (dedupe by org + normalized name), then facilities (dedupe by org + account + name/address), then crews.
 * Every insert is recorded in import_batch_items for rollback.
 */
export async function runImport(input: RunImportInput): Promise<RunImportResult> {
  const { supabase, orgId, batchId, mapping, includeRowIndices } = input;
  const allRows = input.rows;
  const rows = includeRowIndices?.length
    ? includeRowIndices.map((i) => allRows[i]).filter(Boolean)
    : allRows;
  const result: RunImportResult = {
    accountsCreated: 0,
    accountsSkipped: 0,
    facilitiesCreated: 0,
    facilitiesSkipped: 0,
    crewsCreated: 0,
    crewsSkipped: 0,
  };

  await supabase
    .from('import_batches')
    .update({ status: 'importing', updated_at: new Date().toISOString() })
    .eq('id', batchId)
    .eq('org_id', orgId);

  const accountNameToId = new Map<string, string>();
  const customerKey = mapping.customer_name || 'customer_name';
  const buildingKey = mapping.building_name || 'building_name';
  const addressKey = mapping.address || 'address';
  const scheduleKey = mapping.service_schedule_raw || 'service_schedule_raw';

  for (const row of rows) {
    const customerName = getVal(row, mapping, 'customer_name') || row[customerKey]?.trim() || '';
    if (!customerName) continue;

    const normName = normalizeForDedupe(customerName);
    let accountId = accountNameToId.get(normName);

    if (!accountId) {
      const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('org_id', orgId)
        .ilike('name', customerName.trim())
        .limit(1)
        .maybeSingle();

      if (existing && (existing as { id: string }).id) {
        accountId = (existing as { id: string }).id;
        accountNameToId.set(normName, accountId);
        result.accountsSkipped++;
      } else {
        const { data: inserted, error } = await supabase
          .from('accounts')
          .insert({
            org_id: orgId,
            name: customerName.trim().slice(0, 500),
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) {
          result.error = error.message;
          return result;
        }
        accountId = (inserted as { id: string }).id;
        accountNameToId.set(normName, accountId);
        result.accountsCreated++;

        await supabase.from('import_batch_items').insert({
          batch_id: batchId,
          entity_type: 'accounts',
          entity_id: accountId,
        });
      }
    }

    const buildingName = getVal(row, mapping, 'building_name') || row[buildingKey]?.trim() || customerName;
    const address = getVal(row, mapping, 'address') || row[addressKey]?.trim() || '';
    const scheduleRaw = getVal(row, mapping, 'service_schedule_raw') || row[scheduleKey]?.trim() || '';
    const parsed = parseServiceSchedule(scheduleRaw);

    const { data: existingFacList } = await supabase
      .from('facilities')
      .select('id, name, address_line1')
      .eq('org_id', orgId)
      .eq('account_id', accountId);

    const list = (existingFacList ?? []) as { id: string; name?: string; address_line1?: string }[];
    const normBuilding = normalizeForDedupe(buildingName + address);
    const found = list.some(
      (f) => normalizeForDedupe((f.name ?? '') + (f.address_line1 ?? '')) === normBuilding
    );

    if (found) {
      result.facilitiesSkipped++;
    } else {
      const { data: inserted, error } = await supabase
        .from('facilities')
        .insert({
          org_id: orgId,
          account_id: accountId,
          name: buildingName.trim().slice(0, 500),
          address_line1: address.slice(0, 255) || null,
          is_primary: false,
          service_schedule_raw: parsed.service_schedule_raw || null,
          service_frequency_per_week: parsed.service_frequency_per_week,
          service_days: parsed.service_days.length > 0 ? parsed.service_days : [],
          days_serviced_count: parsed.days_serviced_count,
          schedule_needs_review: parsed.needs_review,
          schedule_review_reason: parsed.review_reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        result.error = error.message;
        return result;
      }
      const facId = (inserted as { id: string }).id;
      result.facilitiesCreated++;
      await supabase.from('import_batch_items').insert({
        batch_id: batchId,
        entity_type: 'facilities',
        entity_id: facId,
      });
    }
  }

  const operatorCol = mapping.operator_name ?? (mapping as Record<string, string>).crew_name;
  if (operatorCol) {
    const crewNames = new Set<string>();
    for (const row of rows) {
      const name = getVal(row, mapping, 'operator_name') || getVal(row, mapping as Record<string, string>, 'crew_name') || row[operatorCol]?.trim();
      if (name) crewNames.add(name.trim());
    }
    for (const name of crewNames) {
      const { data: existing } = await supabase
        .from('crews')
        .select('id')
        .eq('org_id', orgId)
        .ilike('name', name)
        .limit(1)
        .maybeSingle();
      if (existing && (existing as { id: string }).id) {
        result.crewsSkipped++;
        continue;
      }
      const { data: inserted, error } = await supabase
        .from('crews')
        .insert({ org_id: orgId, name: name.slice(0, 255) })
        .select('id')
        .single();
      if (error) {
        result.error = error.message;
        return result;
      }
      result.crewsCreated++;
      await supabase.from('import_batch_items').insert({
        batch_id: batchId,
        entity_type: 'crews',
        entity_id: (inserted as { id: string }).id,
      });
    }
  }

  await supabase
    .from('import_batches')
    .update({
      status: result.error ? 'failed' : 'done',
      summary: {
        accountsCreated: result.accountsCreated,
        accountsSkipped: result.accountsSkipped,
        facilitiesCreated: result.facilitiesCreated,
        facilitiesSkipped: result.facilitiesSkipped,
        crewsCreated: result.crewsCreated,
        crewsSkipped: result.crewsSkipped,
        error: result.error,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)
    .eq('org_id', orgId);

  return result;
}
