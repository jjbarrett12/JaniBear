'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthSignUp = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider);
    setError(null);
    const supabase = createClient();
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/onboarding')}` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    setOauthLoading(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const redirectBase = typeof window !== 'undefined' ? window.location.origin : '';

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${redirectBase}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, full_name: fullName || null },
        { onConflict: 'id' }
      );
    }

    if (data.session) {
      window.location.href = '/onboarding';
      return;
    }
    setError(null);
    window.location.href = '/auth/login?confirmed=1';
    return;
  };

  return (
    <Card className="shadow-lg border border-zinc-200/80 rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
      <CardContent className="pt-2 pb-4 px-4 sm:pt-3 sm:pb-5 sm:px-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-lg border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            onClick={() => handleOAuthSignUp('google')}
            disabled={!!oauthLoading}
          >
            <GoogleIcon className="mr-1.5 h-4 w-4 shrink-0" />
            {oauthLoading === 'google' ? '…' : 'Google'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-lg border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
            onClick={() => handleOAuthSignUp('facebook')}
            disabled={!!oauthLoading}
          >
            <FacebookIcon className="mr-1.5 h-4 w-4 shrink-0" />
            {oauthLoading === 'facebook' ? '…' : 'Facebook'}
          </Button>
        </div>
        <div className="relative py-1 mb-4">
          <span className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200" />
          </span>
          <span className="relative flex justify-center text-xs font-medium text-zinc-500 bg-white px-2">
            or sign up with email
          </span>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm font-medium text-zinc-700">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-lg border-zinc-200 bg-zinc-50/50 focus:bg-white placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-lg border-zinc-200 bg-zinc-50/50 focus:bg-white placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 rounded-lg border-zinc-200 bg-zinc-50/50 focus:bg-white placeholder:text-zinc-400 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 rounded p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
            <p className="text-xs text-zinc-500">Use letters, numbers, and symbols for a stronger password</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-lg border-zinc-200 bg-zinc-50/50 focus:bg-white placeholder:text-zinc-400"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-zinc-500 pt-1">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-700">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
