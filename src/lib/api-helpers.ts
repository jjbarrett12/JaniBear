// API helper functions for consistent error handling

import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/errors';

export async function handleApiError(error: unknown) {
  const message = getErrorMessage(error);
  console.error('API Error:', message, error);
  return { error: message };
}

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export function createSuccessResponse(data: any) {
  return Response.json({ success: true, data });
}

export function createErrorResponse(message: string, statusCode: number = 500) {
  return Response.json({ success: false, error: message }, { status: statusCode });
}
