import { z } from 'zod';
import { LEAD_SOURCES, LEAD_STATUSES } from './types';

export const leadSourceSchema = z.enum(LEAD_SOURCES as unknown as [string, ...string[]]);
export const leadStatusSchema = z.enum(LEAD_STATUSES as unknown as [string, ...string[]]);

export const createLeadSchema = z.object({
  source: leadSourceSchema.default('manual'),
  contact_name: z.string().trim().min(0).max(500).optional().nullable(),
  company: z.string().trim().min(0).max(500).optional().nullable(),
  title: z.string().trim().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(50).optional().nullable(),
  linkedin_url: z.string().url().optional().nullable().or(z.literal('')),
  website: z.string().url().optional().nullable().or(z.literal('')),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  zip: z.string().trim().max(20).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  estimated_sq_ft: z.number().min(0).optional().nullable(),
  estimated_locations: z.number().int().min(0).optional().nullable(),
  employee_count: z.number().int().min(0).optional().nullable(),
  current_cleaning_provider: z.string().max(200).optional().nullable(),
  assigned_user_id: z.string().uuid().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: leadStatusSchema.optional(),
  next_follow_up_at: z.string().datetime().optional().nullable(),
  lead_score: z.number().int().min(0).max(100).optional().nullable(),
  qualification_score: z.number().int().min(0).max(100).optional().nullable(),
});

export const logLeadActivitySchema = z.object({
  lead_id: z.string().uuid(),
  activity_type: z.enum(['call', 'email', 'sms', 'meeting', 'note', 'touch', 'status_change', 'converted']),
  subject: z.string().max(500).optional(),
  body: z.string().max(5000).optional(),
  meta: z.record(z.unknown()).optional(),
});

export const convertLeadOptionsSchema = z.object({
  leadId: z.string().uuid(),
  accountId: z.string().uuid().optional().nullable(),
  createNewAccount: z.boolean().optional(),
  accountName: z.string().min(1).max(500).optional(),
  createWalkthrough: z.boolean().optional(),
  walkthroughScheduledAt: z.string().datetime().optional(),
  opportunityStage: z.string().optional(),
  expectedValueCents: z.number().min(0).optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LogLeadActivityInput = z.infer<typeof logLeadActivitySchema>;
export type ConvertLeadOptions = z.infer<typeof convertLeadOptionsSchema>;
