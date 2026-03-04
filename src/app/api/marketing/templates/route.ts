import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getEmailTemplates, createEmailTemplate } from '@/lib/marketing-automation';

export async function GET(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? undefined;
  const templates = await getEmailTemplates(guard.context.activeOrgId!, category);
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const template = await createEmailTemplate(guard.context.activeOrgId!, {
    ...body,
    created_by: guard.context.userId,
  });

  return NextResponse.json(template, { status: 201 });
}
