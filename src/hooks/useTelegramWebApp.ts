import { useEffect, useState, useCallback } from 'react';

// Telegram Web App types
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    isVisible: boolean;
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    isVisible: boolean;
    isActive: boolean;
    text: string;
    color: string;
    textColor: string;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  platform: string;
  version: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegramWebApp = () => {
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    
    if (webApp) {
      setIsTelegram(true);
      setUser(webApp.initDataUnsafe?.user || null);
      setColorScheme(webApp.colorScheme);
      
      // Initialize the web app
      webApp.ready();
      webApp.expand();
      
      // Enable closing confirmation for important actions
      webApp.enableClosingConfirmation();
      
      setIsReady(true);
      
      console.log('Telegram Mini App initialized:', {
        platform: webApp.platform,
        version: webApp.version,
        user: webApp.initDataUnsafe?.user,
        colorScheme: webApp.colorScheme
      });
    } else {
      // Not running in Telegram
      setIsReady(true);
    }
  }, []);

  // Haptic feedback helpers
  const hapticImpact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  }, []);

  const hapticNotification = useCallback((type: 'error' | 'success' | 'warning') => {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  }, []);

  const hapticSelection = useCallback(() => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  }, []);

  // Back button helpers
  const showBackButton = useCallback((callback: () => void) => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(callback);
    }
  }, []);

  const hideBackButton = useCallback(() => {
    window.Telegram?.WebApp?.BackButton?.hide();
  }, []);

  // Main button helpers
  const showMainButton = useCallback((text: string, callback: () => void) => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(callback);
      webApp.MainButton.show();
    }
  }, []);

  const hideMainButton = useCallback(() => {
    window.Telegram?.WebApp?.MainButton?.hide();
  }, []);

  const setMainButtonLoading = useCallback((loading: boolean) => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      if (loading) {
        webApp.MainButton.showProgress();
      } else {
        webApp.MainButton.hideProgress();
      }
    }
  }, []);

  // Close the mini app
  const close = useCallback(() => {
    window.Telegram?.WebApp?.close();
  }, []);

  // Get theme params
  const themeParams = window.Telegram?.WebApp?.themeParams || {};

  return {
    isReady,
    isTelegram,
    user,
    colorScheme,
    themeParams,
    hapticImpact,
    hapticNotification,
    hapticSelection,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    close,
    webApp: window.Telegram?.WebApp
  };
};

export default useTelegramWebApp;
