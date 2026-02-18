'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';

type ForgotPasswordFormProps = { defaultEmail?: string };

export function ForgotPasswordForm({ defaultEmail = '' }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      // Must be listed in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
      const redirectTo = `${window.location.origin}/auth/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
    
    setIsLoading(false);
  };

  if (success) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="p-6 md:p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="pt-4">
              <Link href="/auth/login">
                <Button variant="outline">Back to Sign In</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 text-base rounded-xl border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
          
          <div className="text-center pt-2">
            <Link href="/auth/login" className="text-sm text-primary hover:underline font-medium">
              Back to Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
