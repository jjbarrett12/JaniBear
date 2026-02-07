'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function SignOutLink() {
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };
  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50"
    >
      {signingOut ? 'Signing out…' : 'Sign out and go to sign in'}
    </button>
  );
}

export function OnboardingForm() {
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check auth on mount and set up listener
  useEffect(() => {
    const supabase = createClient();
    
    const checkAuth = async () => {
      // Try to get the session first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        // Pre-fill name from OAuth if available
        if (session.user.user_metadata?.full_name) {
          setFullName(session.user.user_metadata.full_name);
        }
        setIsCheckingAuth(false);
        return;
      }
      
      // Fallback to getUser (makes API call)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
      }
      setIsCheckingAuth(false);
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        if (session.user.user_metadata?.full_name && !fullName) {
          setFullName(session.user.user_metadata.full_name);
        }
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    
    // Get fresh user data
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUserId = user.id;
        setUserId(user.id);
      }
    }
    
    if (!currentUserId) {
      setError('Session expired. Please sign in again.');
      setIsLoading(false);
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
      return;
    }

    try {
      // Create profile first (required for org_members FK; RLS allows insert own profile)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUserId,
          full_name: fullName || null,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(`Profile: ${profileError.message}`);
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName })
        .select()
        .single();

      if (orgError) {
        console.error('Org error:', orgError);
        throw new Error(`Organization: ${orgError.message}`);
      }

      // Create org membership as owner (RLS allows insert own first membership)
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: org.id,
          user_id: currentUserId,
          role: 'owner',
        });

      if (memberError) {
        console.error('Member error:', memberError);
        throw new Error(`Membership: ${memberError.message}`);
      }

      // Full-page redirect so server sees new membership
      window.location.href = '/app/dashboard';
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>
          Set up your organization to start managing inspections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              type="text"
              placeholder="Acme Cleaning Services"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Your Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full h-14 text-lg" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>

          <p className="text-center text-sm text-zinc-500 pt-2">
            Need to use a different account?{' '}
            <SignOutLink />
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
