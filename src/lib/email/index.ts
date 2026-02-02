// Stub for Email provider

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; id?: string }> {
  // TODO: Integrate Resend, SendGrid, or AWS SES
  console.log('Stub: Sending email', message);
  return { success: true, id: 'stub-email-id-' + Date.now() };
}
