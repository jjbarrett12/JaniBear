import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SurveyWizard } from '@/components/survey/survey-wizard';

export default function SurveyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/janibear-logo.png"
              alt="Janibear"
              width={280}
              height={91}
              className="h-14 md:h-20 w-auto object-contain bg-transparent"
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">Pricing</Button>
            </Link>
            <Link href="/survey" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Find Your Plan
            </Link>
            <Link href="/demo">
              <Button className="bg-orange-500 text-white hover:bg-orange-400 border-0">Book a Demo</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">Sign In</Button>
            </Link>
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
