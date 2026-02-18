/**
 * Email adapter for Sales Pulse. Implement with Resend, SendGrid, etc.
 * Stub: logs only; replace with real provider in production.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailAdapter {
  send(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }>;
}

/**
 * Stub adapter: logs and resolves. Replace with Resend/SendGrid in production.
 */
export const stubEmailAdapter: EmailAdapter = {
  async send({ to, subject, html }) {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[salesPulse] stub send:', { to: to.slice(0, 20) + '…', subject });
    }
    return { ok: true };
  },
};
