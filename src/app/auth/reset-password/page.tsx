import Image from 'next/image';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = { title: 'Reset Password | JANIBEAR' };

export default function ResetPasswordPage() {
  // Don't check auth here - user arrives with a recovery token from email
  // The ResetPasswordForm will use the token to update the password
  
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
            Set New Password
          </h1>
          <p className="text-gray-600 text-base">
            Enter your new password below
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
