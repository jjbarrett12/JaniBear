import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getWorkflow, getWorkflowLogs } from '@/lib/workflow-engine';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  if (searchParams.get('view') === 'logs') {
    const logs = await getWorkflowLogs(id);
    return NextResponse.json(logs);
  }

  const workflow = await getWorkflow(id);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  return NextResponse.json(workflow);
}
