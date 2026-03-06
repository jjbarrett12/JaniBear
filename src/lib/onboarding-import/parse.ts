/**
 * Parse CSV and XLSX files; normalize headers and return sample rows + stats.
 */

import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { normalizeHeader, rowWithNormalizedKeys } from './normalize';

export interface ParseResult {
  rows: Record<string, string>[];
  columns: string[];
  normalizedColumns: string[];
  rowCount: number;
  sampleSize: number;
}

/**
 * Parse buffer as CSV or XLSX. Detects by extension or content.
 * Returns first 20 rows as sample, all column names (normalized), and total row count.
 */
export function parseSpreadsheet(
  buffer: Buffer,
  filename: string
): ParseResult {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'xlsx' || ext === 'xls') return parseXlsx(buffer);
  return parseCsv(buffer);
}

/**
 * Parse full file and return all rows with normalized keys (for import run).
 */
export function parseSpreadsheetFull(
  buffer: Buffer,
  filename: string
): { rows: Record<string, string>[]; columns: string[] } {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'xlsx' || ext === 'xls') return parseXlsxFull(buffer);
  return parseCsvFull(buffer);
}

function parseCsv(buffer: Buffer): ParseResult {
  const raw = parse(buffer, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as string[][];

  if (raw.length === 0) {
    return { rows: [], columns: [], normalizedColumns: [], rowCount: 0, sampleSize: 0 };
  }

  const headers = raw[0].map((h) => (h ?? '').trim()).filter(Boolean);
  const normalizedHeaders = headers.map(normalizeHeader).filter(Boolean);
  const dataRows = raw.slice(1);
  const sampleSize = Math.min(20, dataRows.length);
  const rows: Record<string, string>[] = [];

  for (let i = 0; i < sampleSize; i++) {
    const values = dataRows[i] ?? [];
    rows.push(rowWithNormalizedKeys(headers, values));
  }

  return {
    rows,
    columns: headers,
    normalizedColumns: [...new Set(normalizedHeaders)],
    rowCount: dataRows.length,
    sampleSize: rows.length,
  };
}

function parseCsvFull(buffer: Buffer): { rows: Record<string, string>[]; columns: string[] } {
  const raw = parse(buffer, { bom: true, skip_empty_lines: true, relax_column_count: true, trim: true }) as string[][];
  if (raw.length === 0) return { rows: [], columns: [] };
  const headers = raw[0].map((h) => (h ?? '').trim()).filter(Boolean);
  const dataRows = raw.slice(1);
  const rows = dataRows.map((values) => rowWithNormalizedKeys(headers, values));
  return { rows, columns: headers };
}

function parseXlsx(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    return { rows: [], columns: [], normalizedColumns: [], rowCount: 0, sampleSize: 0 };
  }

  const raw = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];

  if (raw.length === 0) {
    return { rows: [], columns: [], normalizedColumns: [], rowCount: 0, sampleSize: 0 };
  }

  const headers = raw[0].map((h) => String(h ?? '').trim()).filter(Boolean);
  const normalizedHeaders = headers.map(normalizeHeader).filter(Boolean);
  const dataRows = raw.slice(1);
  const sampleSize = Math.min(20, dataRows.length);
  const rows: Record<string, string>[] = [];

  for (let i = 0; i < sampleSize; i++) {
    const values = dataRows[i] ?? [];
    const padded = headers.map((_, j) => values[j] ?? '');
    rows.push(rowWithNormalizedKeys(headers, padded));
  }

  return {
    rows,
    columns: headers,
    normalizedColumns: [...new Set(normalizedHeaders)],
    rowCount: dataRows.length,
    sampleSize: rows.length,
  };
}

function parseXlsxFull(buffer: Buffer): { rows: Record<string, string>[]; columns: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return { rows: [], columns: [] };
  const raw = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '', raw: false }) as string[][];
  if (raw.length === 0) return { rows: [], columns: [] };
  const headers = raw[0].map((h) => String(h ?? '').trim()).filter(Boolean);
  const dataRows = raw.slice(1);
  const rows = dataRows.map((values) => {
    const padded = headers.map((_, j) => values[j] ?? '');
    return rowWithNormalizedKeys(headers, padded);
  });
  return { rows, columns: headers };
}
