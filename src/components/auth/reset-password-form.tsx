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
import { CheckCircle2 } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });
    
    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  };

  if (success) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="p-6 md:p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Updated</h2>
            <p className="text-gray-600">
              Your password has been successfully updated. Redirecting to sign in...
            </p>
            <div className="pt-4">
              <Link href="/auth/login">
                <Button>Go to Sign In</Button>
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
            <Label htmlFor="password" className="text-sm font-semibold">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 text-base"
            />
            <PasswordStrengthMeter password={password} />
            <p className="text-xs text-gray-500">
              Use at least 8 characters with a mix of letters, numbers, and symbols
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 text-base"
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
            {isLoading ? 'Updating Password...' : 'Update Password'}
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
