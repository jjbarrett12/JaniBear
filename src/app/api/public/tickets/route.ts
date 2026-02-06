import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/public/tickets
 * Create a service ticket from the public QR form. No auth required.
 * Body: { location_id, title, description?, contact_name?, contact_phone? }
 */
export async function POST(request: Request) {
  let body: {
    location_id?: string;
    title?: string;
    description?: string;
    contact_name?: string;
    contact_phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const location_id = body.location_id?.trim();
  const title = body.title?.trim();
  if (!location_id || !title) {
    return NextResponse.json(
      { error: 'location_id and title are required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: ticketId, error } = await supabase.rpc(
    'create_service_ticket_from_public',
    {
      p_location_id: location_id,
      p_title: title,
      p_description: body.description ?? null,
      p_contact_name: body.contact_name ?? null,
      p_contact_phone: body.contact_phone ?? null,
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: ticketId, success: true });
}
