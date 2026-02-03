import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Preview,
} from '@react-email/components';

interface ProposalEmailProps {
  recipientName: string;
  companyName: string;
  proposalTitle: string;
  totalAmount: number;
  validUntil?: string;
  signingUrl: string;
  senderName: string;
  senderCompany: string;
}

export function ProposalEmail({
  recipientName,
  companyName,
  proposalTitle,
  totalAmount,
  validUntil,
  signingUrl,
  senderName,
  senderCompany,
}: ProposalEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalAmount);

  return (
    <Html>
      <Head />
      <Preview>
        {proposalTitle} - ${totalAmount.toLocaleString()} - Review and Sign
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>JANIBEAR</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>
            
            <Text style={paragraph}>
              {senderName} from {senderCompany} has sent you a proposal for your review and signature.
            </Text>

            {/* Proposal Summary Card */}
            <Section style={proposalCard}>
              <Text style={proposalTitle}>{proposalTitle}</Text>
              <Hr style={divider} />
              <table style={summaryTable}>
                <tbody>
                  <tr>
                    <td style={summaryLabel}>Company:</td>
                    <td style={summaryValue}>{companyName}</td>
                  </tr>
                  <tr>
                    <td style={summaryLabel}>Monthly Amount:</td>
                    <td style={amountValue}>{formattedAmount}</td>
                  </tr>
                  {validUntil && (
                    <tr>
                      <td style={summaryLabel}>Valid Until:</td>
                      <td style={summaryValue}>{validUntil}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button style={ctaButton} href={signingUrl}>
                Review & Sign Proposal
              </Button>
            </Section>

            <Text style={paragraph}>
              Click the button above to review the full proposal and sign electronically. 
              Your signature is legally binding and will activate the service agreement.
            </Text>

            <Text style={paragraph}>
              If you have any questions, simply reply to this email or contact {senderName} directly.
            </Text>

            <Text style={signoff}>
              Best regards,<br />
              {senderName}<br />
              {senderCompany}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent via JANIBEAR. If you didn&apos;t expect this proposal, you can safely ignore this email.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} JANIBEAR. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#f97316',
  padding: '24px',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0',
  letterSpacing: '2px',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '32px',
  borderRadius: '0 0 8px 8px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#4a5568',
  marginBottom: '16px',
};

const proposalCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
};

const proposalTitle = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  marginBottom: '16px',
};

const divider = {
  borderColor: '#e2e8f0',
  marginBottom: '16px',
};

const summaryTable = {
  width: '100%',
};

const summaryLabel = {
  fontSize: '14px',
  color: '#64748b',
  paddingBottom: '8px',
  width: '40%',
};

const summaryValue = {
  fontSize: '14px',
  fontWeight: '500' as const,
  color: '#1a1a1a',
  paddingBottom: '8px',
};

const amountValue = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#059669',
  paddingBottom: '8px',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const ctaButton = {
  backgroundColor: '#f97316',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
};

const signoff = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#4a5568',
  marginTop: '24px',
};

const footer = {
  textAlign: 'center' as const,
  padding: '24px',
};

const footerText = {
  fontSize: '12px',
  color: '#94a3b8',
  marginBottom: '8px',
};

export default ProposalEmail;
