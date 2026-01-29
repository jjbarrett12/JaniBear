import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { SignupForm } from '@/components/auth/signup-form';

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/app/dashboard');
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center">
          <div className="flex justify-center mb-4 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-600 text-base">
            Sign up to get started with Janibear
          </p>
        </div>

        {/* Signup Form */}
        <SignupForm />
      </div>
    </div>
  );
}
