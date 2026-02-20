import { NextResponse } from 'next/server';
import { getSurveyByToken, submitSurveyResponse } from '@/lib/customer-surveys';

/** Public endpoint: no auth required. Token-based survey access. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await getSurveyByToken(token);

  if (!result) {
    return NextResponse.json(
      { error: 'Survey not found, already completed, or expired' },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  try {
    await submitSurveyResponse(token, body.answers ?? []);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to submit survey' },
      { status: 400 }
    );
  }
}
