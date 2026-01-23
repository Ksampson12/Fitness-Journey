import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isIOS, isInstalledPWA, isMobile } from '@/lib/platform';
import { storage } from '@/lib/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isInstalledPWA()) return;

    const checkDismissed = async () => {
      // Check if user previously dismissed
      const wasDismissed = await storage.get<number>('pwa-install-dismissed');
      if (wasDismissed) {
        // Show again after 7 days
        if (Date.now() - wasDismissed < 7 * 24 * 60 * 60 * 1000) {
          return true;
        }
      }
      return false;
    };

    const init = async () => {
      const isDismissed = await checkDismissed();
      if (isDismissed) return;

      // Handle beforeinstallprompt for Chrome/Edge/Samsung
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // For iOS, show custom instructions after a delay
      if (isIOS() && isMobile()) {
        const timer = setTimeout(() => {
          setShowIOSPrompt(true);
        }, 3000); // Show after 3 seconds on iOS
        return () => {
          clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    };

    init();
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    storage.set('pwa-install-dismissed', Date.now());
  };

  // Chrome/Edge install prompt
  if (deferredPrompt && !dismissed) {
    return (
      <div 
        className="fixed bottom-4 left-4 right-4 z-50 safe-area-bottom animate-in slide-in-from-bottom-4"
        data-testid="pwa-install-banner"
      >
        <div className="bg-card border border-border rounded-xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install Fitness Journey</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to home screen for the best experience
              </p>
            </div>
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-dismiss-install-prompt"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDismiss}
              className="flex-1"
              data-testid="button-pwa-not-now"
            >
              Not now
            </Button>
            <Button 
              size="sm" 
              onClick={handleInstall}
              className="flex-1"
              data-testid="install-pwa-button"
            >
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // iOS install instructions
  if (showIOSPrompt && !dismissed) {
    return (
      <div 
        className="fixed bottom-4 left-4 right-4 z-50 safe-area-bottom animate-in slide-in-from-bottom-4"
        data-testid="ios-install-banner"
      >
        <div className="bg-card border border-border rounded-xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Add to Home Screen</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Install this app for quick access
              </p>
            </div>
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-dismiss-ios-prompt"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span>1. Tap</span>
                <Share className="w-4 h-4 text-primary" />
              </span>
              <span className="text-muted-foreground">then</span>
              <span className="flex items-center gap-1">
                <span>2. "Add to Home Screen"</span>
                <Plus className="w-4 h-4 text-primary" />
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="w-full mt-2 text-xs"
            data-testid="button-ios-maybe-later"
          >
            Maybe later
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
