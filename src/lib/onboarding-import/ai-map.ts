/**
 * Call LLM to infer column -> JANIBEAR field mapping. Returns strict JSON validated with zod.
 */

import OpenAI from 'openai';
import { aiMappingResponseSchema, type AIMappingResponse } from './schemas';

const FIELDS_DESCRIPTION = `
Entities and fields to map (column names from the spreadsheet):
- customers: name (required) -> use field "customer_name"
- buildings: customer_name (required), building_name (optional), address (optional)
- contacts: customer_name, name (-> contact_name), email (-> contact_email), phone (-> contact_phone) (all optional)
- operator (crew/team/franchisee/owner-operator): name (optional) -> "operator_name"
- schedules: "service_schedule_raw" = one column containing schedule text (e.g. "MWF", "Mon Wed Fri", "3xweek", "5x week", "daily", "weekdays", "Tue/Thu"). We normalize this server-side. start_time (optional)

Return a JSON object with:
- "mappings": object mapping each JANIBEAR field name to the exact spreadsheet column header (e.g. {"customer_name": "Customer", "operator_name": "Crew", "service_schedule_raw": "Schedule"})
- "confidence": object mapping each field to a number 0.0-1.0
- "notes": array of short strings
- "needs_user_input": array of field names that are ambiguous or missing
Use only the column names provided. If a field has no matching column, omit it from mappings and add to needs_user_input.
`;

export async function inferMapping(
  columns: string[],
  sampleRows: Record<string, string>[],
  options?: { retry?: boolean }
): Promise<AIMappingResponse> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const samplePreview = sampleRows.slice(0, 5).map((r) => JSON.stringify(r));
  const systemContent = `You are a data mapping assistant. Return only valid JSON. ${FIELDS_DESCRIPTION}
Return STRICT JSON with keys: mappings, confidence, notes, needs_user_input. No markdown, no code block.`;

  const userContent = `Spreadsheet columns (normalized): ${JSON.stringify(columns)}
Sample rows (first 5): ${samplePreview.join('\n')}
Return the mapping JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? '';
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(cleaned) as unknown;

  const result = aiMappingResponseSchema.safeParse(parsed);
  if (result.success) return result.data;

  if (options?.retry !== false) {
    return inferMapping(columns, sampleRows, { retry: false });
  }
  throw new Error('LLM returned invalid mapping JSON');
}
