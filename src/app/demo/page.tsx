'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, CheckCircle2, Calendar, Sparkles } from 'lucide-react';

type Interest = 'demo' | 'early-access' | null;

export default function DemoPage() {
  const [interest, setInterest] = useState<Interest>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: POST to API (e.g. /api/demo-leads) or Supabase when backend is ready
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center shrink-0" style={{ minHeight: 40 }}>
              <Image src="/janibear-logo.png" alt="Janibear" width={560} height={182} className="!h-16 md:!h-20 w-auto !max-h-none object-contain bg-transparent" unoptimized />
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
        <section className="container mx-auto px-4 py-24 flex-1 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">We&apos;ll be in touch</h1>
            <p className="text-zinc-400 mb-8">
              Thanks for your interest. We&apos;ll reach out within one business day to schedule your demo or get you on the early access list.
            </p>
            <Link href="/">
              <Button className="bg-orange-500 text-white hover:bg-orange-400 border-0">Back to home</Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0" style={{ minHeight: 40 }}>
            <Image src="/janibear-logo.png" alt="Janibear" width={560} height={182} className="!h-16 md:!h-20 w-auto !max-h-none object-contain bg-transparent" unoptimized />
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

      <section className="container mx-auto px-4 py-16 md:py-24 flex-1">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              Book a demo or get early access
            </h1>
            <p className="text-zinc-400">
              Tell us a bit about you. Bring your pricing sheet—we&apos;ll configure it.
            </p>
          </div>

          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => setInterest('demo')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl border text-sm font-medium transition-colors ${
                interest === 'demo'
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Book a Demo
            </button>
            <button
              type="button"
              onClick={() => setInterest('early-access')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl border text-sm font-medium transition-colors ${
                interest === 'early-access'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Early Access
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-zinc-300">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1.5 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1.5 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-500"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="company" className="text-zinc-300">Company</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="mt-1.5 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-500"
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-zinc-300">Role</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="mt-1.5 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-500"
                placeholder="e.g. Sales rep, Owner, Operations manager"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-zinc-300">Message (optional)</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="mt-1.5 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-500 min-h-[100px]"
                placeholder="Anything we should know? Bring your pricing sheet—we'll configure it."
              />
            </div>
            <Button
              type="submit"
              disabled={!interest || loading}
              className="w-full h-12 bg-orange-500 text-white hover:bg-orange-400 border-0 disabled:opacity-50"
            >
              {loading ? 'Sending...' : interest === 'demo' ? 'Request demo' : 'Join early access'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            We&apos;ll configure your pricing rules. No spam—we&apos;ll only reach out about your request.
          </p>
        </div>
      </section>
    </div>
  );
}
