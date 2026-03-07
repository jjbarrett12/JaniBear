/**
 * GRIZZLY Sales Engine — seed data for demos and testing.
 * Run with: npx tsx scripts/seed-grizzly-sales.ts (or via Supabase seed)
 *
 * Seeds:
 * - Representative leads (multiple sources, statuses, scores)
 * - Walkthroughs in multiple statuses
 * - Opportunities in multiple stages
 * - Proposals in multiple states
 * - Stale records and possible duplicates for UI testing
 */

// TODO: Implement when Supabase client is available in script context:
// 1. Create lead_import_batches (1–2)
// 2. Create leads with variety: source (manual, referral, csv_import, zoominfo), status (new, qualified, contacted), lead_score 0–95, some with next_follow_up_at, some is_possible_duplicate
// 3. Create walkthroughs (requested, scheduled, completed, no_show)
// 4. Create opportunities (qualified, walkthrough_completed, proposal_sent, negotiation, closed_won, closed_lost with loss_reason)
// 5. Create proposals (draft, sent, viewed, accepted)
// 6. Link lead → opportunity → proposal where appropriate
// 7. Create lead_activities for a few leads

export async function seedGrizzlySales(_orgId: string, _userId: string): Promise<{ leads: number; walkthroughs: number; opportunities: number; proposals: number }> {
  return { leads: 0, walkthroughs: 0, opportunities: 0, proposals: 0 };
}
