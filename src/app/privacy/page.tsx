import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | JANIBEAR',
  description: 'JANIBEAR privacy policy.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-4 text-zinc-400">
          This page describes how JANIBEAR collects, uses, and protects your information.
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
