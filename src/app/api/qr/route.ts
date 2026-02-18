import QRCode from 'qrcode';
import { NextResponse } from 'next/server';

/**
 * GET /api/qr?location=UUID or ?facility=UUID
 * Returns a PNG QR code that links to the public ticket form for this location/facility.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location');
  const facilityId = searchParams.get('facility');
  const ticketSlug = facilityId ?? locationId;
  if (!ticketSlug) {
    return NextResponse.json({ error: 'Missing location or facility' }, { status: 400 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (request.headers.get('x-forwarded-proto') && request.headers.get('host')
      ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
      : 'https://janibear.com');
  const ticketUrl = `${baseUrl.replace(/\/$/, '')}/ticket/${ticketSlug}`;

  try {
    const png = await QRCode.toBuffer(ticketUrl, {
      type: 'png',
      width: 280,
      margin: 2,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    });
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate QR' },
      { status: 500 }
    );
  }
}
