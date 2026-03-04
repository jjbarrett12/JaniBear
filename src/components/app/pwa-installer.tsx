'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandName } from '@/components/ui/brand-name';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (isStandalone) return;
    if (sessionStorage.getItem('pwa-install-dismissed') === 'true') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [mounted, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!mounted || !showInstallPrompt) return null;
  if (sessionStorage.getItem('pwa-install-dismissed') === 'true') return null;

  return (
    <Card className="fixed bottom-24 left-4 right-4 z-50 shadow-xl max-w-md lg:left-6 lg:bottom-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Install <BrandName variant="light" />
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Add to your home screen for a desktop app experience and quick access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {deferredPrompt ? (
          <Button onClick={handleInstall} className="w-full h-12" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Install app
          </Button>
        ) : isIOS ? (
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Share className="h-4 w-4" />
              Add to Home Screen
            </p>
            <p className="text-muted-foreground">
              Tap the share button in Safari, then scroll and tap <strong>“Add to Home Screen”</strong>.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
