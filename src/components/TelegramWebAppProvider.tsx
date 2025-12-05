import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useTheme } from '@/contexts/ThemeContext';

interface TelegramWebAppProviderProps {
  children: React.ReactNode;
}

export const TelegramWebAppProvider = ({ children }: TelegramWebAppProviderProps) => {
  const { isTelegram, colorScheme, showBackButton, hideBackButton, hapticImpact } = useTelegramWebApp();
  const { setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync theme with Telegram - only when in Telegram environment
  useEffect(() => {
    if (isTelegram && colorScheme) {
      // Telegram provides 'light' or 'dark', which matches our Theme type
      setTheme(colorScheme as 'light' | 'dark');
    }
  }, [isTelegram, colorScheme, setTheme]);

  // Handle back button
  useEffect(() => {
    if (!isTelegram) return;

    const isRootRoute = location.pathname === '/' || location.pathname === '/home';
    
    if (!isRootRoute) {
      showBackButton(() => {
        hapticImpact('light');
        navigate(-1);
      });
    } else {
      hideBackButton();
    }

    return () => {
      hideBackButton();
    };
  }, [isTelegram, location.pathname, showBackButton, hideBackButton, navigate, hapticImpact]);

  return <>{children}</>;
};

export default TelegramWebAppProvider;
