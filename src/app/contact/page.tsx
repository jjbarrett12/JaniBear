import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MessageSquare, ArrowRight } from 'lucide-react';
import { BrandName } from '@/components/ui/brand-name';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ minHeight: 56 }}>
            <Image
              src="/logo.png"
              alt="JANIBEAR"
              width={560}
              height={182}
              className="!h-20 md:!h-24 w-auto !max-h-none object-contain bg-transparent"
              priority
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                Pricing
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                Sign In
              </Button>
            </Link>
            <Link href="/demo">
              <Button className="bg-amber-500 text-white hover:bg-amber-400 border-0 shadow-lg hover:shadow-amber-500/25">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Have questions about <BrandName />? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Send us a message</CardTitle>
                <CardDescription className="text-zinc-400">
                  Fill out the form below and we&apos;ll get back to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-zinc-300">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-zinc-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-zinc-300">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={6}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 text-white hover:bg-amber-400"
                  >
                    Send Message
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="bg-zinc-900/80 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Other ways to reach us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Email</h3>
                      <p className="text-zinc-400 text-sm">
                        <a href="mailto:support@janibear.com" className="hover:text-amber-400 transition-colors">
                          support@janibear.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Book a Demo</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        Schedule a personalized demo to see <BrandName /> in action
                      </p>
                      <Link href="/demo">
                        <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                          Schedule Demo
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Support Hours</h3>
                      <p className="text-zinc-400 text-sm">
                        Monday - Friday<br />
                        9:00 AM - 5:00 PM PST
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Quick Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link href="/pricing" className="block text-zinc-400 hover:text-amber-400 transition-colors text-sm">
                      View Pricing Plans
                    </Link>
                    <Link href="/survey" className="block text-zinc-400 hover:text-amber-400 transition-colors text-sm">
                      Find Your Plan
                    </Link>
                    <Link href="/demo" className="block text-zinc-400 hover:text-amber-400 transition-colors text-sm">
                      Book a Demo
                    </Link>
                    <Link href="/auth/signup" className="block text-zinc-400 hover:text-amber-400 transition-colors text-sm">
                      Sign Up
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="[&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              <Image
                src="/logo.png"
                alt="JANIBEAR"
                width={220}
                height={72}
                className="h-14 md:h-16 w-auto mb-4 object-contain bg-transparent opacity-95"
                unoptimized
              />
              <p className="text-sm text-zinc-500">
                Turn walkthroughs into proposals—camera + AI. Built for janitorial sales teams.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/survey" className="hover:text-white transition-colors">Find Your Plan</Link></li>
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-sm text-zinc-500">
            <p>&copy; {new Date().getFullYear()} <BrandName />. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
