import { Footer } from '@/components/site/Footer';

/**
 * Marketing layout: footer with CTA ("Ready to run...", "Get a Private Demo", "See Plans")
 * and link columns (Product / Company / Legal).
 *
 * IMPORTANT: MarketingFooter (Footer) must ONLY render here. Dashboard (/app/*) and auth
 * (/auth/*) use other layouts and must NEVER render this footer.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
