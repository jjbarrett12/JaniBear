import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getSurveys, createSurvey, getSurveyScorecard } from '@/lib/customer-surveys';

export async function GET(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);

  if (searchParams.get('view') === 'scorecard') {
    const surveyId = searchParams.get('survey_id') ?? undefined;
    const scorecard = await getSurveyScorecard(guard.context.activeOrgId!, surveyId);
    return NextResponse.json(scorecard);
  }

  const surveys = await getSurveys(guard.context.activeOrgId!);
  return NextResponse.json(surveys);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const survey = await createSurvey(
    guard.context.activeOrgId!,
    { ...body, created_by: guard.context.userId },
    body.questions ?? []
  );

  return NextResponse.json(survey, { status: 201 });
}
