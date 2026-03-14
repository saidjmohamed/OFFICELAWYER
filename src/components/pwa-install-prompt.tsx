'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed or prompt was dismissed this session
    const hasPromptBeenShown = sessionStorage.getItem('pwa_prompt_shown');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (hasPromptBeenShown || isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom install prompt
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also listen for app installed event
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      // Show the browser install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // User accepted the install prompt
        setIsVisible(false);
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
      // Mark as shown for this session
      sessionStorage.setItem('pwa_prompt_shown', 'true');
    }
  }, [deferredPrompt]);

  const handleLater = useCallback(() => {
    setIsVisible(false);
    // Mark as shown for this session
    sessionStorage.setItem('pwa_prompt_shown', 'true');
  }, []);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-fade-in">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">تثبيت التطبيق</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-1"
                  onClick={handleLater}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                قم بتثبيت هذا التطبيق على جهازك للوصول السريع وتجربة أفضل.
              </p>
              
              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-9"
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? (
                    <div className="h-4 w-4 ml-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="h-4 w-4 ml-2" />
                  )}
                  تثبيت
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9"
                  onClick={handleLater}
                >
                  لاحقاً
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
