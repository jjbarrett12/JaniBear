import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandName } from '@/components/ui/brand-name';

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Thank you for subscribing to <BrandName variant="light" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Your subscription is now active. You can start using all the features included in your plan.
            </p>
            {searchParams.session_id && (
              <p className="text-xs text-gray-500 mt-2">
                Session ID: {searchParams.session_id}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signup" className="flex-1">
              <Button className="w-full" size="lg">
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/app/dashboard" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t text-center">
            <p className="text-sm text-gray-600">
              Need help? <Link href="/contact" className="text-primary hover:underline">Contact Support</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
