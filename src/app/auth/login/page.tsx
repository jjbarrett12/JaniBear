import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    redirect(membership ? '/app/dashboard' : '/onboarding');
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* Logo Section */}
        <div className="text-center">
          <div className="flex justify-center mb-2 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/janibear-logo.png"
              alt="Janibear Logo"
              width={600}
              height={200}
              className="h-36 md:h-44 lg:h-56 w-auto object-contain bg-transparent"
              priority
              unoptimized
              style={{ 
                imageRendering: 'auto',
              }}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-base">
            Sign in to your Janibear account
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
}
