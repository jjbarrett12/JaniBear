import { createClient } from '@/lib/supabase/server';

interface LogActivityParams {
  orgId: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: Record<string, any>;
}

export async function logActivity({
  orgId,
  userId,
  entityType,
  entityId,
  action,
  details,
}: LogActivityParams) {
  try {
    const supabase = await createClient();
    await supabase.from('activity_log').insert({
      org_id: orgId,
      user_id: userId || null,
      entity_type: entityType,
      entity_id: entityId,
      action,
      details: details || null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break the main flow
  }
}

export async function createNotification({
  orgId,
  userId,
  type,
  title,
  message,
  link,
}: {
  orgId: string;
  userId: string;
  type: 'issue' | 'inspection' | 'task' | 'system';
  title: string;
  message?: string;
  link?: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from('notifications').insert({
      org_id: orgId,
      user_id: userId,
      type,
      title,
      message: message || null,
      link: link || null,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
