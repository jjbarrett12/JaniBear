import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { enrollContact } from '@/lib/marketing-automation';
import { marketingSequenceEnrollBody } from '@/lib/api-validation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = marketingSequenceEnrollBody.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? 'Invalid body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { contact_email, contact_name, lead_id } = parsed.data;

  const enrollment = await enrollContact(
    guard.context.activeOrgId!,
    id,
    contact_email,
    contact_name ?? undefined,
    lead_id,
    guard.context.userId
  );

  return NextResponse.json(enrollment, { status: 201 });
}
