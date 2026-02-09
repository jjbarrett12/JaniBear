import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-6">
      <div className="relative">
        <LoadingSpinner size="lg" />
        <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" aria-hidden />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Loading...</p>
      <div className="flex gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500/60 animate-bounce [animation-delay:0ms]" />
        <div className="h-2 w-2 rounded-full bg-amber-500/60 animate-bounce [animation-delay:150ms]" />
        <div className="h-2 w-2 rounded-full bg-amber-500/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
