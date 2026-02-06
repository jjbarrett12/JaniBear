/**
 * Default 10-touch sales cadence for new templates.
 * Channel: email | call | linkedin | sms | meeting
 */

export interface CadenceStepInput {
  step_number: number;
  channel: 'email' | 'call' | 'linkedin' | 'sms' | 'meeting';
  delay_days: number;
  subject?: string | null;
  body_template?: string | null;
  call_script?: string | null;
}

export const DEFAULT_10_TOUCH_CADENCE: CadenceStepInput[] = [
  { step_number: 1, channel: 'email', delay_days: 0, subject: 'Quick intro – [Company] janitorial', body_template: 'Hi {{contact_name}},\n\nI wanted to reach out because we work with businesses like {{company}} to keep facilities clean and compliant. Would you have 15 minutes this week for a quick conversation?\n\nBest,\n{{rep_name}}' },
  { step_number: 2, channel: 'call', delay_days: 2, call_script: 'Intro call: confirm decision-maker, share one differentiator, ask for a short follow-up meeting or walk-through.' },
  { step_number: 3, channel: 'email', delay_days: 2, subject: 'Following up – 15 min?', body_template: 'Hi {{contact_name}},\n\nFollowing up on my note. I’d love to show you how we’ve helped similar facilities. Would a 15-minute call or quick site visit work?\n\n{{rep_name}}' },
  { step_number: 4, channel: 'linkedin', delay_days: 3, subject: null, body_template: 'Connect request + short note: "Hi {{contact_name}}, I sent you an email about facility services – would be great to connect here too."' },
  { step_number: 5, channel: 'call', delay_days: 2, call_script: 'Second call: reference email/LinkedIn, offer value (e.g. free walk-through or audit), propose next step.' },
  { step_number: 6, channel: 'email', delay_days: 3, subject: 'One more try – {{company}}', body_template: 'Hi {{contact_name}},\n\nI don’t want to clutter your inbox. If timing isn’t right, just say "not now" and I’ll check back in a few months. If you’re open to a quick conversation, reply with a time that works.\n\n{{rep_name}}' },
  { step_number: 7, channel: 'call', delay_days: 4, call_script: 'Third call: leave a brief voicemail if no answer; mention specific value (e.g. compliance, labor savings).' },
  { step_number: 8, channel: 'sms', delay_days: 1, subject: null, body_template: 'Hi {{contact_name}}, {{rep_name}} here – sent you a few emails about facility cleaning for {{company}}. Reply YES if you’d like a 15-min call, or NOT NOW and I’ll follow up later.' },
  { step_number: 9, channel: 'call', delay_days: 5, call_script: 'Final call: short, respectful close. Offer to send one-pager and follow up in 90 days if not now.' },
  { step_number: 10, channel: 'email', delay_days: 2, subject: 'Closing the loop – {{company}}', body_template: 'Hi {{contact_name}},\n\nI’ve reached out a few times. If things change and you’d like to explore working together, I’m here. I’ll touch base again in a few months.\n\nThanks,\n{{rep_name}}' },
];

export const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  call: 'Phone Call',
  linkedin: 'LinkedIn',
  sms: 'SMS',
  meeting: 'Meeting',
};
