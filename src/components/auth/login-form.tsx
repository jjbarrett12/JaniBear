'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Show session error if redirected from auth/continue (session could not be established)
  useEffect(() => {
    const sessionError = searchParams.get('error');
    if (sessionError === 'session') {
      setError('Session could not be established. Please sign in again.');
    }
  }, [searchParams]);

  // Load saved credentials on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('janibear_saved_email');
      const savedRemember = localStorage.getItem('janibear_remember_me');
      if (savedEmail && savedRemember === 'true') {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  const handleResendConfirmation = async () => {
    if (!email?.trim()) return;
    setResending(true);
    setResendSuccess(false);
    setError(null);
    setErrorCode(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setResendSuccess(true);
      setError(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setResendSuccess(false);

    const supabase = createClient();
    
    if (isMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        alert('Check your email for the magic link!');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        const code = (error as { code?: string }).code ?? '';
        setErrorCode(code);
        // Use error.code for reliable detection (Supabase Auth API)
        if (code === 'invalid_credentials' || error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (code === 'email_not_confirmed' || error.message.includes('Email not confirmed')) {
          setError('Your email is not confirmed yet. Check your inbox (and spam) for the confirmation link, then try again.');
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        // Check if user needs to complete onboarding
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', data.user.id)
          .limit(1)
          .single();

        // Save credentials if "Remember Me" is checked
        if (rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('janibear_saved_email', email);
          localStorage.setItem('janibear_remember_me', 'true');
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('janibear_saved_email');
          localStorage.removeItem('janibear_remember_me');
        }

        const targetPath = membership ? '/app/dashboard' : '/onboarding';
        // Let session persist to cookies, then go via auth/continue so the server
        // can read the cookie and redirect (or client polls and redirects).
        await supabase.auth.getSession();
        await new Promise((r) => setTimeout(r, 1500));
        window.location.replace(`/auth/continue?next=${encodeURIComponent(targetPath)}`);
        return;
      }
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="shadow-lg border border-zinc-200/80 rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
      <CardContent className="pt-3 pb-4 px-4 sm:pt-4 sm:pb-5 sm:px-5">
        <form onSubmit={handleEmailLogin} className="space-y-4">
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

          {!isMagicLink && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 rounded-lg border-zinc-200 bg-zinc-50/50 focus:bg-white pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none rounded p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500/20 cursor-pointer"
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer text-zinc-600">
                    Remember me
                  </Label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          {resendSuccess && (
            <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              Confirmation email sent. Check your inbox (and spam), then try signing in again.
            </div>
          )}
          {error && (
            <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 space-y-2">
              <p>{error}</p>
              {errorCode === 'email_not_confirmed' && email?.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="mt-2 border-red-200 text-red-700 hover:bg-red-100"
                >
                  {resending ? 'Sending...' : 'Resend confirmation email'}
                </Button>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Signing in...' : isMagicLink ? 'Send Magic Link' : 'Sign in'}
          </Button>

          <div className="text-center space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsMagicLink(!isMagicLink)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              {isMagicLink ? 'Use password instead' : 'Use magic link instead'}
            </button>
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-orange-600 hover:text-orange-700">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
