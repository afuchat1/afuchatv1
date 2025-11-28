import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Check, Smartphone, Zap, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error('Install prompt not available. Please use your browser menu to install.');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      toast.error('Failed to install app');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Install AfuChat</CardTitle>
          <CardDescription>
            Get the full app experience with offline support and faster loading
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">App-like Experience</h3>
                <p className="text-sm text-muted-foreground">Install to your home screen and launch like a native app</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Works Offline</h3>
                <p className="text-sm text-muted-foreground">Access your chats even without internet connection</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Loads instantly with optimized caching</p>
              </div>
            </div>
          </div>

          {/* Install Button */}
          {isInstalled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary p-4 bg-primary/10 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="font-semibold">App is installed!</span>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
                variant="default"
              >
                Go to App
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-3">
              <Button 
                onClick={handleInstallClick}
                className="w-full"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Install Now
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={handleInstallClick}
                className="w-full"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Install Now
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
