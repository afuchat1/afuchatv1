import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPromptBanner = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show banner if not installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode && !dismissed) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      navigate('/install');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install error:', error);
      navigate('/install');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showBanner || isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg animate-in slide-in-from-top">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Download className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Install AfuChat</p>
              <p className="text-xs opacity-90 truncate">Get instant access from your home screen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-background text-foreground hover:bg-background/90 text-xs h-8"
            >
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPromptBanner;
