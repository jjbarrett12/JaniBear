/**
 * Customer satisfaction survey service: CSAT/NPS creation, distribution,
 * response collection, and scorecard analytics.
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import type {
  CustomerSurvey,
  SurveyQuestion,
  SurveyResponse,
  SurveyAnswer,
  SurveyScorecard,
} from '@/types/features';

// ─── Survey CRUD ─────────────────────────────────────────────────────────────

export async function getSurveys(orgId: string): Promise<CustomerSurvey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_surveys')
    .select('*, survey_questions(count)')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomerSurvey[];
}

export async function getSurveyWithQuestions(id: string): Promise<CustomerSurvey | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customer_surveys')
    .select('*, survey_questions(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as CustomerSurvey;
}

export async function createSurvey(
  orgId: string,
  survey: Partial<CustomerSurvey>,
  questions: Partial<SurveyQuestion>[]
): Promise<CustomerSurvey> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customer_surveys')
    .insert({
      org_id: orgId,
      name: survey.name,
      survey_type: survey.survey_type ?? 'csat',
      description: survey.description,
      trigger_type: survey.trigger_type ?? 'manual',
      status: 'draft',
      settings: survey.settings ?? {},
      created_by: survey.created_by,
    })
    .select()
    .single();

  if (error) throw error;

  if (questions.length > 0) {
    await supabase.from('survey_questions').insert(
      questions.map((q, i) => ({
        survey_id: data.id,
        question_text: q.question_text,
        question_type: q.question_type ?? 'rating',
        options: q.options ?? [],
        is_required: q.is_required ?? true,
        sort_order: i,
      }))
    );
  }

  return data as CustomerSurvey;
}

// ─── Distribution ────────────────────────────────────────────────────────────

/** Send a survey to a specific contact, returning the response token. */
export async function sendSurveyInvite(
  orgId: string,
  surveyId: string,
  recipientEmail: string,
  recipientName: string | null,
  accountId?: string,
  facilityId?: string
): Promise<string> {
  const supabase = await createClient();
  const expires = new Date(Date.now() + 14 * 86400000);

  const { data, error } = await supabase
    .from('survey_responses')
    .insert({
      org_id: orgId,
      survey_id: surveyId,
      account_id: accountId,
      facility_id: facilityId,
      respondent_email: recipientEmail,
      respondent_name: recipientName,
      status: 'pending',
      expires_at: expires.toISOString(),
    })
    .select('token')
    .single();

  if (error) throw error;

  const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/survey/${data.token}`;
  await sendEmail({
    to: recipientEmail,
    subject: 'We value your feedback — Quick survey',
    html: `
      <p>Hi ${recipientName || 'there'},</p>
      <p>We'd love to hear how we're doing. Please take a moment to share your feedback:</p>
      <p><a href="${surveyUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Take Survey</a></p>
      <p>This link expires in 14 days. Thank you for your time!</p>
    `,
  });

  return data.token;
}

/** Bulk send surveys to all billing contacts for accounts. */
export async function sendSurveyToAccounts(
  orgId: string,
  surveyId: string,
  accountIds: string[]
): Promise<{ sent: number; errors: string[] }> {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, billing_email, billing_contact_name')
    .eq('org_id', orgId)
    .in('id', accountIds);

  let sent = 0;
  const errors: string[] = [];

  for (const acct of accounts ?? []) {
    if (!acct.billing_email) {
      errors.push(`${acct.name}: No billing email`);
      continue;
    }
    try {
      await sendSurveyInvite(orgId, surveyId, acct.billing_email, acct.billing_contact_name, acct.id);
      sent++;
    } catch (err) {
      errors.push(`${acct.name}: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  return { sent, errors };
}

// ─── Response Collection (public, token-based) ──────────────────────────────

/** Retrieve a survey for a respondent using their token (no auth required). */
export async function getSurveyByToken(token: string): Promise<{
  response: SurveyResponse;
  survey: CustomerSurvey;
  questions: SurveyQuestion[];
} | null> {
  const supabase = createAdminClient();

  const { data: response } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('token', token)
    .single();

  if (!response) return null;
  if (response.status === 'completed') return null;
  if (response.expires_at && new Date(response.expires_at) < new Date()) return null;

  const { data: survey } = await supabase
    .from('customer_surveys')
    .select('*, survey_questions(*)')
    .eq('id', response.survey_id)
    .single();

  if (!survey) return null;

  return {
    response: response as SurveyResponse,
    survey: survey as CustomerSurvey,
    questions: (survey.survey_questions ?? []) as SurveyQuestion[],
  };
}

/** Submit answers for a survey response (public, no auth). */
export async function submitSurveyResponse(
  token: string,
  answers: Array<{ question_id: string; answer_text?: string; answer_rating?: number; answer_choice?: string }>
): Promise<void> {
  const supabase = createAdminClient();

  const { data: response } = await supabase
    .from('survey_responses')
    .select('id, status, expires_at')
    .eq('token', token)
    .single();

  if (!response) throw new Error('Invalid survey token');
  if (response.status === 'completed') throw new Error('Survey already completed');
  if (response.expires_at && new Date(response.expires_at) < new Date()) throw new Error('Survey expired');

  await supabase.from('survey_answers').insert(
    answers.map((a) => ({
      response_id: response.id,
      question_id: a.question_id,
      answer_text: a.answer_text,
      answer_rating: a.answer_rating,
      answer_choice: a.answer_choice,
    }))
  );

  const ratings = answers.filter((a) => a.answer_rating != null).map((a) => a.answer_rating!);
  const overallScore = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
  const npsAnswer = answers.find((a) => a.answer_rating != null && a.answer_rating >= 0 && a.answer_rating <= 10);

  await supabase
    .from('survey_responses')
    .update({
      status: 'completed',
      submitted_at: new Date().toISOString(),
      overall_score: overallScore,
      nps_score: npsAnswer?.answer_rating,
    })
    .eq('id', response.id);
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getSurveyScorecard(orgId: string, surveyId?: string): Promise<SurveyScorecard> {
  const supabase = await createClient();
  let query = supabase
    .from('survey_responses')
    .select('*, accounts(name)')
    .eq('org_id', orgId)
    .eq('status', 'completed');

  if (surveyId) query = query.eq('survey_id', surveyId);

  const { data: responses } = await query;
  const all = responses ?? [];
  const total = all.length;

  const csatScores = all.filter((r) => r.overall_score != null).map((r) => r.overall_score as number);
  const avgCsat = csatScores.length > 0 ? csatScores.reduce((s, v) => s + v, 0) / csatScores.length : null;

  const npsScores = all.filter((r) => r.nps_score != null).map((r) => r.nps_score as number);
  const promoters = npsScores.filter((s) => s >= 9).length;
  const passives = npsScores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsTotal = promoters + passives + detractors;
  const npsScore = npsTotal > 0 ? Math.round(((promoters - detractors) / npsTotal) * 100) : null;

  const { count: totalSent } = await supabase
    .from('survey_responses')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const accountMap = new Map<string, { name: string; scores: number[]; count: number }>();
  for (const r of all) {
    if (!r.account_id || r.overall_score == null) continue;
    const acctName = (r.accounts as { name: string } | null)?.name ?? 'Unknown';
    const entry = accountMap.get(r.account_id) ?? { name: acctName, scores: [], count: 0 };
    entry.scores.push(r.overall_score as number);
    entry.count++;
    accountMap.set(r.account_id, entry);
  }

  const byAccount = Array.from(accountMap.entries()).map(([id, v]) => ({
    account_id: id,
    account_name: v.name,
    avg_score: v.scores.reduce((s, x) => s + x, 0) / v.scores.length,
    response_count: v.count,
  }));

  return {
    avg_csat: avgCsat ? Math.round(avgCsat * 10) / 10 : null,
    nps_score: npsScore,
    promoters,
    passives,
    detractors,
    total_responses: total,
    response_rate: totalSent ? total / totalSent : null,
    trend: 'stable',
    by_account: byAccount,
  };
}
