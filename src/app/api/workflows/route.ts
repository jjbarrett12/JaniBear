import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getWorkflows, createWorkflow } from '@/lib/workflow-engine';

export async function GET() {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const workflows = await getWorkflows(guard.context.activeOrgId!);
  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const workflow = await createWorkflow(
    guard.context.activeOrgId!,
    { ...body, created_by: guard.context.userId },
    body.triggers ?? [],
    body.actions ?? []
  );

  return NextResponse.json(workflow, { status: 201 });
}
