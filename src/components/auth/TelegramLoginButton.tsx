import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  disabled?: boolean;
  mode?: 'signin' | 'signup';
}

const TelegramLoginButton = ({ disabled, mode = 'signin' }: TelegramLoginButtonProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTelegramAuth = async (user: TelegramUser) => {
    setLoading(true);
    try {
      // Check if this Telegram user is already linked to an account
      const { data: telegramUser, error: fetchError } = await supabase
        .from('telegram_users')
        .select('user_id, is_linked')
        .eq('telegram_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (telegramUser?.is_linked && telegramUser?.user_id) {
        // User exists, sign them in using a custom token approach
        // Since we can't directly sign in without email/password, we'll create a magic link flow
        toast.info('Telegram account found! Redirecting...');
        
        // For now, redirect to a page that handles Telegram auth completion
        // Store the Telegram user data temporarily
        sessionStorage.setItem('telegram_auth_user', JSON.stringify(user));
        navigate('/auth/telegram-callback');
      } else {
        // New Telegram user - create or link account
        if (mode === 'signup') {
          // Store Telegram data and proceed to complete profile
          sessionStorage.setItem('telegram_auth_user', JSON.stringify(user));
          navigate('/auth/telegram-callback?mode=signup');
        } else {
          toast.error('No account linked to this Telegram. Please sign up first.');
        }
      }
    } catch (error: any) {
      console.error('Telegram auth error:', error);
      toast.error('Failed to authenticate with Telegram');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Define the callback function globally
    (window as any).onTelegramAuth = handleTelegramAuth;

    // Load Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'AfuChatBot'); // Your bot username
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, []);

  // Fallback button if widget doesn't load
  const handleManualTelegramLogin = () => {
    // Open Telegram bot with auth param
    window.open('https://t.me/AfuChatBot?start=auth', '_blank');
    toast.info('Complete authentication in Telegram, then return here.');
  };

  return (
    <div className="w-full">
      {/* Hidden container for Telegram widget */}
      <div ref={containerRef} className="hidden" />
      
      {/* Custom styled button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-base"
        onClick={handleManualTelegramLogin}
        disabled={disabled || loading}
      >
        {loading ? 'Connecting...' : (
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        )}
        Continue with Telegram
      </Button>
    </div>
  );
};

export default TelegramLoginButton;
