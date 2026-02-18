import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-8 w-8 text-zinc-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-zinc-400 mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-400">
              Go home
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Sign in
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Book a 15-Min Demo
            </Button>
          </Link>
        </div>
        <p className="text-sm text-zinc-500 mt-8">
          <Link href="/" className="inline-flex items-center gap-2 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/logo.png"
              alt="JANIBEAR"
              width={140}
              height={46}
              className="h-8 w-auto object-contain opacity-80"
              unoptimized
            />
          </Link>
        </p>
      </div>
    </div>
  );
}
