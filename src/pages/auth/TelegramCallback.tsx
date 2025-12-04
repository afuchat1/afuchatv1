import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomLoader } from '@/components/ui/CustomLoader';
import Logo from '@/components/Logo';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const TelegramCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error' | 'success'>('processing');
  const [message, setMessage] = useState('Authenticating with Telegram...');

  useEffect(() => {
    const handleTelegramAuth = async () => {
      const mode = searchParams.get('mode');
      const telegramDataStr = sessionStorage.getItem('telegram_auth_user');

      if (!telegramDataStr) {
        setStatus('error');
        setMessage('No Telegram authentication data found. Please try again.');
        return;
      }

      try {
        const telegramUser: TelegramUser = JSON.parse(telegramDataStr);
        
        // Check if Telegram user exists in our system
        const { data: existingUser, error: fetchError } = await supabase
          .from('telegram_users')
          .select('user_id, is_linked')
          .eq('telegram_id', telegramUser.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingUser?.is_linked && existingUser?.user_id) {
          // Existing linked user - sign them in
          // Generate a temporary email for Telegram users
          const tempEmail = `telegram_${telegramUser.id}@afuchat.telegram`;
          const tempPassword = `tg_${telegramUser.id}_${telegramUser.auth_date}_${telegramUser.hash.substring(0, 16)}`;

          // Try to sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: tempEmail,
            password: tempPassword,
          });

          if (signInError) {
            // If sign in fails, the account might exist with different credentials
            setStatus('error');
            setMessage('Unable to sign in. Your Telegram account may be linked to a different authentication method.');
            sessionStorage.removeItem('telegram_auth_user');
            return;
          }

          setStatus('success');
          setMessage('Signed in successfully!');
          sessionStorage.removeItem('telegram_auth_user');
          toast.success('Welcome back!');
          
          setTimeout(() => navigate('/home'), 1000);
        } else if (mode === 'signup') {
          // New user signup with Telegram
          const tempEmail = `telegram_${telegramUser.id}@afuchat.telegram`;
          const tempPassword = `tg_${telegramUser.id}_${telegramUser.auth_date}_${telegramUser.hash.substring(0, 16)}`;
          const displayName = `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`;
          const handle = telegramUser.username || `user_${telegramUser.id}`;

          // Sign up with Supabase
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: tempEmail,
            password: tempPassword,
            options: {
              data: {
                display_name: displayName,
                handle: handle,
                avatar_url: telegramUser.photo_url || null,
                telegram_id: telegramUser.id,
              },
              emailRedirectTo: `${window.location.origin}/home`,
            },
          });

          if (signUpError) {
            if (signUpError.message.includes('already registered')) {
              // Account exists, try to sign in
              const { error: retrySignIn } = await supabase.auth.signInWithPassword({
                email: tempEmail,
                password: tempPassword,
              });

              if (retrySignIn) {
                throw retrySignIn;
              }
            } else {
              throw signUpError;
            }
          }

          // Link Telegram user to the new account
          if (authData?.user) {
            await supabase
              .from('telegram_users')
              .upsert({
                telegram_id: telegramUser.id,
                user_id: authData.user.id,
                is_linked: true,
                telegram_username: telegramUser.username,
                telegram_first_name: telegramUser.first_name,
                telegram_last_name: telegramUser.last_name,
              }, { onConflict: 'telegram_id' });
          }

          setStatus('success');
          setMessage('Account created successfully!');
          sessionStorage.removeItem('telegram_auth_user');
          toast.success('Welcome to AfuChat!');
          
          setTimeout(() => navigate('/home'), 1000);
        } else {
          setStatus('error');
          setMessage('No account found for this Telegram user. Please sign up first.');
          sessionStorage.removeItem('telegram_auth_user');
        }
      } catch (error: any) {
        console.error('Telegram auth error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed. Please try again.');
        sessionStorage.removeItem('telegram_auth_user');
      }
    };

    handleTelegramAuth();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Logo size="md" className="mb-8" />
      
      <div className="text-center space-y-4">
        {status === 'processing' && (
          <>
            <CustomLoader />
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-foreground font-medium">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-foreground font-medium">{message}</p>
            <button
              onClick={() => navigate('/auth')}
              className="text-primary hover:underline text-sm mt-4"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TelegramCallback;
