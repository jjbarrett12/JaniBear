'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const REMEMBER_EMAIL_COOKIE = 'janibear_remember_email';

export type SignInState = { error?: string; code?: string };

/**
 * Email/password sign-in runs on the server so the session is written to cookies
 * in the same response. No client-side session → cookie race.
 */
export async function signInWithPasswordAction(
  _prev: SignInState | null,
  formData: FormData
): Promise<SignInState> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const rememberMe = formData.get('remember_me') === '1';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const code = (error as { code?: string }).code ?? '';
    if (code === 'invalid_credentials' || error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password. Please try again.', code };
    }
    if (code === 'email_not_confirmed' || error.message.includes('Email not confirmed')) {
      return {
        error: 'Your email is not confirmed yet. Check your inbox (and spam) for the confirmation link.',
        code: 'email_not_confirmed',
      };
    }
    return { error: error.message, code };
  }

  if (!data.user) {
    return { error: 'Sign in failed. Please try again.' };
  }

  const cookieStore = await cookies();

  if (rememberMe) {
    cookieStore.set(REMEMBER_EMAIL_COOKIE, email, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    cookieStore.delete(REMEMBER_EMAIL_COOKIE);
  }

  redirect('/api/auth/landing');
}
