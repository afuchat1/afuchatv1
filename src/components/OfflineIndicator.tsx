import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert) return null;

  return (
    <Alert className="fixed bottom-4 left-4 right-4 z-50 border-yellow-500 bg-yellow-500/10 md:left-auto md:right-4 md:max-w-md">
      <WifiOff className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="text-sm">
        <strong>You're offline</strong>
        <p className="mt-1 text-xs text-muted-foreground">
          Available: View cached posts, read messages
          <br />
          Unavailable: Create posts, send messages, react
        </p>
      </AlertDescription>
    </Alert>
  );
};
