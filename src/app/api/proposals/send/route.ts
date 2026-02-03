import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { ProposalEmail } from '@/lib/email/proposal-email';
import { render } from '@react-email/components';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { proposalId, recipientEmail, recipientName, personalMessage } = body;

    if (!proposalId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: proposalId and recipientEmail' },
        { status: 400 }
      );
    }

    // Fetch proposal with related data
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        leads (full_name, company_name, email),
        opportunities (
          clients (name)
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get org info
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('organizations (name)')
      .eq('user_id', user.id)
      .single();

    const senderCompany = (orgMember?.organizations as { name?: string })?.name || 'JANIBEAR';

    // Get user profile for sender name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const senderName = profile?.full_name || user.email?.split('@')[0] || 'Sales Team';

    // Generate public token if not exists
    let publicToken = proposal.public_token;
    if (!publicToken) {
      publicToken = crypto.randomUUID();
      await supabase
        .from('proposals')
        .update({ public_token: publicToken })
        .eq('id', proposalId);
    }

    // Build signing URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://janibear.com';
    const signingUrl = `${baseUrl}/proposals/${proposalId}/public/${publicToken}`;

    // Format valid until date
    const validUntil = proposal.valid_until_date
      ? new Date(proposal.valid_until_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : undefined;

    // Determine recipient info
    const finalRecipientName = recipientName || 
      proposal.leads?.full_name || 
      proposal.opportunities?.clients?.name || 
      'Customer';
    
    const companyName = proposal.leads?.company_name || 
      proposal.opportunities?.clients?.name || 
      'Your Company';

    // Send email
    if (resend) {
      const emailHtml = await render(
        ProposalEmail({
          recipientName: finalRecipientName,
          companyName,
          proposalTitle: proposal.proposal_title || 'Service Proposal',
          totalAmount: proposal.total_amount || 0,
          validUntil,
          signingUrl,
          senderName,
          senderCompany,
        })
      );

      const { error: emailError } = await resend.emails.send({
        from: `${senderCompany} <proposals@janibear.com>`,
        to: recipientEmail,
        subject: `${proposal.proposal_title || 'Service Proposal'} - Please Review and Sign`,
        html: emailHtml,
        replyTo: user.email || undefined,
      });

      if (emailError) {
        console.error('Email error:', emailError);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping email send');
    }

    // Update proposal status
    await supabase
      .from('proposals')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    // Create proposal event
    await supabase.from('proposal_events').insert({
      org_id: proposal.org_id,
      proposal_id: proposalId,
      event_type: 'sent',
      event_data: {
        recipient_email: recipientEmail,
        recipient_name: finalRecipientName,
        sent_by: user.id,
        personal_message: personalMessage,
      },
    });

    return NextResponse.json({
      success: true,
      message: resend ? 'Proposal sent successfully' : 'Proposal marked as sent (email not configured)',
      signingUrl,
    });
  } catch (error) {
    console.error('Send proposal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
