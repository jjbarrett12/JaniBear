import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

type Props = { searchParams: { email?: string } };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/app/dashboard');
  }

  const defaultEmail = typeof searchParams.email === 'string' ? searchParams.email.trim() : undefined;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/logo.png"
              alt="JANIBEAR Logo"
              width={600}
              height={200}
              className="h-48 md:h-56 lg:h-72 w-auto object-contain bg-transparent"
              priority
              unoptimized
              style={{ 
                imageRendering: 'auto',
              }}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600 text-base">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>
        <ForgotPasswordForm defaultEmail={defaultEmail} />
      </div>
    </div>
  );
}
