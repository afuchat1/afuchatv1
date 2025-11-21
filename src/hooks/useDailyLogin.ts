import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNexa } from './useNexa';

/**
 * Hook to automatically check and award daily login streak
 * Runs once when user logs in or on app load
 */
export const useDailyLogin = () => {
  const { user } = useAuth();
  const { checkDailyLogin } = useNexa();

  useEffect(() => {
    if (user) {
      // Check daily login after a short delay to ensure everything is loaded
      const timer = setTimeout(() => {
        checkDailyLogin();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, checkDailyLogin]);
};
