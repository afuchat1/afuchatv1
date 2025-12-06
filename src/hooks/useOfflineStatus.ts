import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOnline: boolean;
  isOfflineReady: boolean;
}

export const useOfflineStatus = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOfflineReady: false
  });

  // Check if service worker is ready
  const checkServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        setState(prev => ({ ...prev, isOfflineReady: true }));
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check service worker on mount
    checkServiceWorker();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServiceWorker]);

  return state;
};
