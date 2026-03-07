/**
 * Central copy for Sales → Ops launch handoff. Keeps messaging consistent
 * and makes "what happens when you submit/accept" obvious for beta users.
 */

export const LAUNCH_HANDOFF_COPY = {
  /** Sales: what "Submit to Operations" does */
  submitToOpsExplanation:
    'Sends this packet to the Ops team so they can activate the account and create schedules.',
  /** Ops: what "Accept" does */
  acceptExplanation:
    'Accepting will activate this account and create schedules. Requesting changes sends your feedback to Sales.',
  /** Ops list: short intro */
  intakeListIntro:
    'Review Launch Packets from Sales. Accept to activate the account and create schedules; Request changes to send back with a reason.',
  /** Ops list empty */
  intakeEmpty:
    'No launches in queue. When Sales submits a launch packet, it will appear here for you to accept or request changes.',
} as const;
