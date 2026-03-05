import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | JANIBEAR',
  description: 'JANIBEAR terms of service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-4 text-zinc-400">
          Terms of service for using JANIBEAR products and services.
        </p>
        <p className="mt-4">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
