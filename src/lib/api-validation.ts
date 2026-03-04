/**
 * Shared Zod schemas for API route body/param validation.
 * Use with .safeParse() and return 400 on error.
 */
import { z } from 'zod';

const uuid = z.string().uuid('Invalid ID format');

export const adminUsersEnableBody = z
  .object({
    membershipId: uuid.optional(),
    userId: uuid.optional(),
    tenantId: uuid.optional(),
  })
  .refine((d) => d.membershipId ?? (d.userId && d.tenantId), {
    message: 'Provide membershipId or (userId + tenantId)',
  });

export const adminUsersSetPasswordBody = z.object({
  userId: z.string().min(1, 'userId is required').max(64),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(512),
});

export const workOrderStatusValues = [
  'pending',
  'assigned',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const;

export const workOrderPatchBody = z.object({
  status: z.enum(workOrderStatusValues).optional(),
});

export const marketingSequenceEnrollBody = z.object({
  contact_email: z.string().email('Valid contact_email required'),
  contact_name: z.string().max(256).optional(),
  lead_id: uuid.optional(),
});

export const marketingSequenceCreateBody = z.object({
  name: z.string().min(1, 'name is required').max(256).optional(),
  description: z.string().max(2000).optional(),
  trigger_type: z.string().max(64).optional(),
  status: z.string().max(32).optional(),
}).passthrough();
