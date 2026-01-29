'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import Link from 'next/link';

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
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
    const redirectBase = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL)
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
      : (typeof window !== 'undefined' ? window.location.origin : '');
    
    // Sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${redirectBase}/auth/callback`,
      },
    });
    
    if (signUpError) {
      console.error('Signup error:', signUpError);
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail signup if profile creation fails - it might already exist
      }

      // Check if email confirmation is required
      // In Supabase, if email confirmation is enabled, the user will need to confirm
      // before they can sign in. If disabled, they can sign in immediately.
      if (data.session) {
        // User is immediately signed in (email confirmation disabled)
        router.push('/onboarding');
        router.refresh();
      } else {
        // Email confirmation required
        setError(null);
        alert('Please check your email to confirm your account before signing in.');
        router.push('/auth/login');
      }
    } else {
      setError('Failed to create account. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="shadow-xl border-0">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

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
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <PasswordStrengthMeter password={password} />
            <p className="text-xs text-gray-500">
              Use at least 8 characters with a mix of letters, numbers, and symbols
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
          
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
