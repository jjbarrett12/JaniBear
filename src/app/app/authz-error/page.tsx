import { AlertCircle } from 'lucide-react';
import { AuthzErrorActions } from './authz-error-actions';

export default function AuthzErrorPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <AlertCircle className="h-16 w-16 text-amber-500 mb-4" aria-hidden />
      <h1 className="text-2xl font-semibold text-foreground">We couldn&apos;t verify access</h1>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        We couldn&apos;t verify access. Please retry.
      </p>
      <AuthzErrorActions />
    </div>
  );
}
