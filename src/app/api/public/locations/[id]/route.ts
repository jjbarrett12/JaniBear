import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/public/locations/[id]
 * Returns display info for a location (name, org_name) for the public ticket form.
 * Used when someone scans a QR code - no auth required.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing location id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_public_location_display', {
    p_location_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (data == null) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
