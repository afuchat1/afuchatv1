import { useEffect, useCallback } from 'react';

export const useLandscapeMode = (enabled: boolean) => {
  const lockLandscape = useCallback(async () => {
    try {
      // Check if screen orientation API is available
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch (error) {
      // Orientation lock not supported or failed - this is fine
      console.log('Landscape lock not supported');
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    try {
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch (error) {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      lockLandscape();
      
      // Add CSS class for landscape mode
      document.documentElement.classList.add('game-fullscreen');
    } else {
      unlockOrientation();
      document.documentElement.classList.remove('game-fullscreen');
    }

    return () => {
      unlockOrientation();
      document.documentElement.classList.remove('game-fullscreen');
    };
  }, [enabled, lockLandscape, unlockOrientation]);

  return { lockLandscape, unlockOrientation };
};
