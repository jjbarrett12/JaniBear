/**
 * Smart Migration Audit: analyze parsed rows and produce a migration audit summary.
 * Runs after file parse, before final import. Does not block import for warnings.
 */

import { normalizeForDedupe } from './normalize';
import { parseServiceSchedule } from './service-schedule';

export type AuditSeverity = 'error' | 'warning';

export interface AuditIssue {
  row_index: number;
  severity: AuditSeverity;
  field: string;
  code: string;
  message: string;
}

export interface MigrationAuditSummary {
  customers_found: number;
  buildings_found: number;
  operators_found: number;
  schedule_rows_recognized: number;
  rows_ready_to_import: number;
  rows_needing_review: number;
  total_rows: number;
}

export interface MigrationAuditResult {
  summary: MigrationAuditSummary;
  issues: AuditIssue[];
  readiness_score_pct: number;
  warning_count: number;
  error_count: number;
  /** Row indices (0-based) that have no errors and can be imported. */
  ready_row_indices: number[];
}

export type ConfirmedMapping = Record<string, string>;

function getVal(row: Record<string, string>, mapping: ConfirmedMapping, field: string): string {
  const col = mapping[field];
  return (col ? row[col] : row[field])?.trim() ?? '';
}

function isBlankRow(row: Record<string, string>, mapping: ConfirmedMapping): boolean {
  const customer = getVal(row, mapping, 'customer_name');
  const building = getVal(row, mapping, 'building_name');
  const address = getVal(row, mapping, 'address');
  return !customer && !building && !address;
}

/** Friendly messages for UI (non-technical). Warnings do not block import; only errors do. */
const MESSAGES: Record<string, string> = {
  missing_customer_name: "Customer name is missing — we need this to create the account. This row will be skipped.",
  missing_building_and_address: "No building or address — we'll use the customer name as the location.",
  blank_row: "This row is empty and will be skipped.",
  duplicate_customer: "Same customer appears on another row — we'll merge them.",
  duplicate_building: "Same location appears for this customer on another row — we'll skip duplicates.",
  ambiguous_schedule: "Schedule says “daily” or “nightly” — please confirm which days.",
  unsupported_schedule: "Schedule type isn’t fully supported yet — you may need to set it up manually.",
  uncertain_operator: "Crew or team name looks unclear — please check.",
  weak_address: "No address — consider adding one for clarity.",
};

function issueMessage(code: string): string {
  return MESSAGES[code] ?? code;
}

/**
 * Run migration audit on parsed rows with confirmed mapping.
 * Returns summary, structured issues, readiness score, and ready row indices.
 */
export function runMigrationAudit(
  rows: Record<string, string>[],
  mapping: ConfirmedMapping
): MigrationAuditResult {
  const issues: AuditIssue[] = [];
  const customerNormToFirstRow = new Map<string, number>();
  const buildingKeyToFirstRow = new Map<string, number>();
  const scheduleRecognized = new Set<number>();
  const rowsWithErrors = new Set<number>();

  const customerKey = mapping.customer_name || 'customer_name';
  const buildingKey = mapping.building_name || 'building_name';
  const addressKey = mapping.address || 'address';
  const operatorKey = mapping.operator_name ?? (mapping as Record<string, string>).crew_name;
  const scheduleKey = mapping.service_schedule_raw || 'service_schedule_raw';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const customerName = (getVal(row, mapping, 'customer_name') || row[customerKey]?.trim()) ?? '';
    const buildingName = (getVal(row, mapping, 'building_name') || row[buildingKey]?.trim()) ?? '';
    const address = (getVal(row, mapping, 'address') || row[addressKey]?.trim()) ?? '';
    const operatorName = operatorKey ? (getVal(row, mapping, 'operator_name') || (row[operatorKey]?.trim() ?? '')) : '';
    const scheduleRaw = (getVal(row, mapping, 'service_schedule_raw') || row[scheduleKey]?.trim()) ?? '';

    if (isBlankRow(row, mapping)) {
      issues.push({
        row_index: i,
        severity: 'warning',
        field: 'row',
        code: 'blank_row',
        message: issueMessage('blank_row'),
      });
      continue;
    }

    if (!customerName.trim()) {
      issues.push({
        row_index: i,
        severity: 'error',
        field: 'customer_name',
        code: 'missing_customer_name',
        message: issueMessage('missing_customer_name'),
      });
      rowsWithErrors.add(i);
    }

    if (!customerName.trim()) {
      // Already flagged; skip further checks for this row
      continue;
    }

    const normCustomer = normalizeForDedupe(customerName);
    const firstCustomerRow = customerNormToFirstRow.get(normCustomer);
    if (firstCustomerRow !== undefined && firstCustomerRow !== i) {
      issues.push({
        row_index: i,
        severity: 'warning',
        field: 'customer_name',
        code: 'duplicate_customer',
        message: issueMessage('duplicate_customer'),
      });
    } else if (firstCustomerRow === undefined) {
      customerNormToFirstRow.set(normCustomer, i);
    }

    const hasBuildingOrAddress = buildingName.length > 0 || address.length > 0;
    if (!hasBuildingOrAddress) {
      issues.push({
        row_index: i,
        severity: 'warning',
        field: 'building_name',
        code: 'missing_building_and_address',
        message: issueMessage('missing_building_and_address'),
      });
    } else if (address.length === 0 && buildingName.length > 0) {
      issues.push({
        row_index: i,
        severity: 'warning',
        field: 'address',
        code: 'weak_address',
        message: issueMessage('weak_address'),
      });
    }
    if (hasBuildingOrAddress) {
      const buildingNorm = normalizeForDedupe(buildingName + address);
      const key = `${normCustomer}:${buildingNorm}`;
      const firstBuildingRow = buildingKeyToFirstRow.get(key);
      if (firstBuildingRow !== undefined && firstBuildingRow !== i) {
        issues.push({
          row_index: i,
          severity: 'warning',
          field: 'building_name',
          code: 'duplicate_building',
          message: issueMessage('duplicate_building'),
        });
      } else if (firstBuildingRow === undefined) {
        buildingKeyToFirstRow.set(key, i);
      }
    }

    if (operatorKey && operatorName) {
      const trimmed = operatorName.trim();
      if (trimmed.length <= 1 || /^(n\/a|na|tbd|tba|none|\.)$/i.test(trimmed)) {
        issues.push({
          row_index: i,
          severity: 'warning',
          field: 'operator_name',
          code: 'uncertain_operator',
          message: issueMessage('uncertain_operator'),
        });
      }
    }

    if (scheduleRaw) {
      const parsed = parseServiceSchedule(scheduleRaw);
      if (parsed.service_frequency_per_week || parsed.service_days.length > 0) {
        scheduleRecognized.add(i);
      }
      if (parsed.needs_review && parsed.review_reason) {
        const lower = parsed.review_reason.toLowerCase();
        const isAmbiguous = /daily|nightly/.test(lower);
        const isUnsupported = /biweekly|monthly|quarterly|as needed|on call/.test(lower);
        if (isUnsupported) {
          issues.push({
            row_index: i,
            severity: 'warning',
            field: 'service_schedule_raw',
            code: 'unsupported_schedule',
            message: issueMessage('unsupported_schedule'),
          });
        } else if (isAmbiguous) {
          issues.push({
            row_index: i,
            severity: 'warning',
            field: 'service_schedule_raw',
            code: 'ambiguous_schedule',
            message: issueMessage('ambiguous_schedule'),
          });
        } else {
          issues.push({
            row_index: i,
            severity: 'warning',
            field: 'service_schedule_raw',
            code: 'unsupported_schedule',
            message: parsed.review_reason,
          });
        }
      }
    }
  }

  const totalRows = rows.length;
  const ready_row_indices: number[] = [];
  for (let i = 0; i < totalRows; i++) {
    if (!rowsWithErrors.has(i) && !isBlankRow(rows[i], mapping)) {
      const customerName = (getVal(rows[i], mapping, 'customer_name') || rows[i][customerKey]?.trim()) ?? '';
      if (customerName.trim()) ready_row_indices.push(i);
    }
  }

  const customers_found = customerNormToFirstRow.size;
  const buildings_found = buildingKeyToFirstRow.size;
  const operatorNames = new Set<string>();
  for (let i = 0; i < rows.length; i++) {
    const name = operatorKey ? (getVal(rows[i], mapping, 'operator_name') || (rows[i][operatorKey]?.trim() ?? '')) : '';
    if (name.trim()) operatorNames.add(normalizeForDedupe(name));
  }
  const operators_found = operatorNames.size;

  const error_count = issues.filter((x) => x.severity === 'error').length;
  const warning_count = issues.filter((x) => x.severity === 'warning').length;
  const rows_ready_to_import = ready_row_indices.length;
  const rowsWithAnyIssue = new Set(issues.map((x) => x.row_index));
  const rows_needing_review = rowsWithAnyIssue.size;
  const readiness_score_pct = totalRows > 0 ? Math.round((rows_ready_to_import / totalRows) * 100) : 100;

  return {
    summary: {
      customers_found,
      buildings_found,
      operators_found,
      schedule_rows_recognized: scheduleRecognized.size,
      rows_ready_to_import,
      rows_needing_review,
      total_rows: totalRows,
    },
    issues,
    readiness_score_pct,
    warning_count,
    error_count,
    ready_row_indices,
  };
}
