import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { enrollContact } from '@/lib/marketing-automation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json();

  const enrollment = await enrollContact(
    guard.context.activeOrgId!,
    id,
    body.contact_email,
    body.contact_name,
    body.lead_id,
    guard.context.userId
  );

  return NextResponse.json(enrollment, { status: 201 });
}
