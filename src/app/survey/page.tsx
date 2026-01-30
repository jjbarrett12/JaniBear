import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SurveyWizard } from '@/components/survey/survey-wizard';

export default function SurveyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ minHeight: 40 }}>
            <Image src="/janibear-logo.png" alt="Janibear" width={560} height={182} className="!h-8 md:!h-10 w-auto !max-h-none object-contain bg-transparent" unoptimized />
          </Link>
          <div className="flex items-center justify-end gap-4 md:gap-6 flex-1 min-w-0">
            <Link href="/pricing"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Pricing</Button></Link>
            <Link href="/survey"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Find Your Plan</Button></Link>
            <Link href="/#features"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Features</Button></Link>
            <Link href="/contact"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Contact</Button></Link>
            <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Sign In</Button></Link>
            <Link href="/auth/signup"><Button size="sm" className="bg-orange-500 text-white hover:bg-orange-400 border-0 shrink-0">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Find your perfect plan
            </h1>
            <p className="text-zinc-400">
              Answer a few quick questions and we&apos;ll recommend the best plan for your business.
            </p>
          </div>
          <SurveyWizard dark />
        </div>
      </section>
    </div>
  );
}
