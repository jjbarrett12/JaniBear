'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

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

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider);
    setError(null);
    
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });
      
      if (oauthError) {
        console.error('OAuth error:', oauthError);
        setError(oauthError.message);
        setOauthLoading(null);
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      
      setOauthLoading(null);
    } catch (err) {
      console.error('OAuth error:', err);
      setError('Failed to start sign in. Please try again.');
      setOauthLoading(null);
    }
  };

  useEffect(() => {
    const urlError = searchParams.get('error');
    const urlMessage = searchParams.get('message');
    
    if (urlError === 'session') {
      setError('Session could not be established. Please sign in again.');
    } else if (urlError === 'oauth') {
      setError(urlMessage || 'OAuth sign in failed. Please try again.');
    }
  }, [searchParams]);

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
    
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      
      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
        setError(null);
      }
    } catch {
      setError('Failed to resend confirmation email.');
    }
    
    setResending(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setResendSuccess(false);

    try {
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
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const code = (error as { code?: string }).code ?? '';
        setErrorCode(code);
        
        if (code === 'invalid_credentials' || error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (code === 'email_not_confirmed' || error.message.includes('Email not confirmed')) {
          setError('Your email is not confirmed yet. Check your inbox (and spam) for the confirmation link.');
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Save remember me preference
        if (rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('janibear_saved_email', email);
          localStorage.setItem('janibear_remember_me', 'true');
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('janibear_saved_email');
          localStorage.removeItem('janibear_remember_me');
        }

        // Check if user has org membership
        let targetPath = '/onboarding';
        try {
          const { data: membership } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', data.user.id)
            .limit(1)
            .maybeSingle();
          
          if (membership?.org_id) {
            targetPath = '/app/dashboard';
          }
        } catch {
          // Default to onboarding if check fails
        }

        // Use router.push for client-side navigation which preserves cookies
        router.push(targetPath);
        router.refresh();
        return;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-700/80 bg-white dark:bg-gray-900 shadow-xl shadow-zinc-200/20 dark:shadow-none p-6 sm:p-8">
      {/* Social sign-in first */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-medium text-[15px]"
          onClick={() => handleOAuthSignIn('google')}
          disabled={!!oauthLoading || isLoading}
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon className="mr-3 h-5 w-5 shrink-0" />
          )}
          {oauthLoading === 'google' ? 'Signing in…' : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-medium text-[15px]"
          onClick={() => handleOAuthSignIn('facebook')}
          disabled={!!oauthLoading || isLoading}
        >
          {oauthLoading === 'facebook' ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          ) : (
            <FacebookIcon className="mr-3 h-5 w-5 shrink-0" />
          )}
          {oauthLoading === 'facebook' ? 'Signing in…' : 'Continue with Facebook'}
        </Button>
      </div>

      <div className="relative my-6">
        <span className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200" />
        </span>
        <span className="relative flex justify-center bg-white dark:bg-gray-900">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 px-3">or sign in with email</span>
        </span>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-sm font-medium text-zinc-700">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
            className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white placeholder:text-zinc-400"
          />
        </div>

        {!isMagicLink && (
          <>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium text-zinc-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 rounded p-1.5 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-sm font-medium text-zinc-600">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Forgot password?
              </Link>
            </div>
          </>
        )}

        {resendSuccess && (
          <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            Confirmation email sent. Check your inbox (and spam), then sign in again.
          </div>
        )}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 space-y-2">
            <p>{error}</p>
            {errorCode === 'email_not_confirmed' && email?.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="border-red-200 text-red-700 hover:bg-red-100"
              >
                {resending ? 'Sending…' : 'Resend confirmation email'}
              </Button>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[15px] shadow-sm"
          disabled={isLoading || !!oauthLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : isMagicLink ? (
            'Send magic link'
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-zinc-100 space-y-3 text-center">
        <button
          type="button"
          onClick={() => setIsMagicLink(!isMagicLink)}
          className="text-sm text-zinc-500 hover:text-amber-600 font-medium block w-full"
        >
          {isMagicLink ? 'Use password instead' : 'Use magic link instead'}
        </button>
        <p className="text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-amber-600 hover:text-amber-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
