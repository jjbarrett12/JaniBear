import { NextResponse } from 'next/server';
import { getSurveyByToken, submitSurveyResponse } from '@/lib/customer-surveys';

const MAX_ANSWERS = 50;
const MAX_ANSWER_TEXT_LENGTH = 2000;

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

function validateAnswers(
  raw: unknown,
  questionIds: Set<string>
): { ok: true; answers: Array<{ question_id: string; answer_text?: string; answer_rating?: number; answer_choice?: string }> } | { ok: false; status: number; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, status: 400, error: 'answers must be an array' };
  }
  if (raw.length > MAX_ANSWERS) {
    return { ok: false, status: 400, error: `answers must not exceed ${MAX_ANSWERS} items` };
  }
  const answers: Array<{ question_id: string; answer_text?: string; answer_rating?: number; answer_choice?: string }> = [];
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (!a || typeof a !== 'object' || typeof (a as { question_id?: unknown }).question_id !== 'string') {
      return { ok: false, status: 400, error: `answers[${i}]: question_id is required and must be a string` };
    }
    const questionId = (a as { question_id: string }).question_id;
    if (!questionIds.has(questionId)) {
      return { ok: false, status: 400, error: `answers[${i}]: question_id not in this survey` };
    }
    const answerText = (a as { answer_text?: unknown }).answer_text;
    const text = typeof answerText === 'string' ? answerText.slice(0, MAX_ANSWER_TEXT_LENGTH) : undefined;
    const rating = typeof (a as { answer_rating?: unknown }).answer_rating === 'number' ? (a as { answer_rating: number }).answer_rating : undefined;
    const choice = typeof (a as { answer_choice?: unknown }).answer_choice === 'string' ? (a as { answer_choice: string }).answer_choice : undefined;
    answers.push({ question_id: questionId, answer_text: text, answer_rating: rating, answer_choice: choice });
  }
  return { ok: true, answers };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  let body: { answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
  }

  const result = await getSurveyByToken(token);
  if (!result) {
    return NextResponse.json(
      { error: 'Survey not found, already completed, or expired' },
      { status: 404 }
    );
  }

  const questionIds = new Set(result.questions.map((q) => q.id));
  const validated = validateAnswers(body.answers ?? [], questionIds);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  try {
    await submitSurveyResponse(token, validated.answers);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to submit survey' },
      { status: 400 }
    );
  }
}
