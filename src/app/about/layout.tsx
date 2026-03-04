import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | JANIBEAR',
  description: 'About JANIBEAR — built inside a commercial cleaning company. Operator-built, account retention focus, field-tested workflows.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
