'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

        // Full page redirect so the server receives auth cookies on the next request.
        // router.push() can run before cookies are set, so the server may not see the session.
        if (!membership) {
          window.location.href = '/onboarding';
        } else {
          window.location.href = '/app/dashboard';
        }
        return;
      }
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="shadow-xl border-0">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-14 text-base"
            />
          </div>
          
          {!isMagicLink && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-14 text-base"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                  <Label htmlFor="rememberMe" className="text-base font-medium cursor-pointer text-gray-700">
                    Remember me
                  </Label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </>
          )}
          
          {resendSuccess && (
            <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              Confirmation email sent. Check your inbox (and spam), then try signing in again.
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20 space-y-2">
              <p>{error}</p>
              {errorCode === 'email_not_confirmed' && email?.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="mt-2"
                >
                  {resending ? 'Sending...' : 'Resend confirmation email'}
                </Button>
              )}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Signing in...' : isMagicLink ? 'Send Magic Link' : 'Sign In'}
          </Button>
          
          <div className="text-center space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMagicLink(!isMagicLink)}
              className="text-sm text-primary hover:underline font-medium block w-full"
            >
              {isMagicLink ? 'Use password instead' : 'Use magic link instead'}
            </button>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
