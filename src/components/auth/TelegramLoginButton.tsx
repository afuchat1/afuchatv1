import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TelegramLoginButtonProps {
  disabled?: boolean;
  mode?: 'signin' | 'signup';
}

const TelegramLoginButton = ({ disabled, mode = 'signin' }: TelegramLoginButtonProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [telegramInput, setTelegramInput] = useState('');

  const handleTelegramAuth = async () => {
    if (!telegramInput.trim()) {
      toast.error('Please enter your Telegram username or phone number');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-web-auth', {
        body: { 
          telegramIdentifier: telegramInput.trim().replace('@', ''),
          mode 
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.success && data.token && data.email) {
        // Verify OTP using the magic link token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.token,
          type: 'magiclink',
        });

        if (verifyError) {
          console.error('OTP verification error:', verifyError);
          throw verifyError;
        }

        toast.success('Signed in successfully!');
        setOpen(false);
        navigate('/home');
      } else if (data.notFound) {
        if (mode === 'signin') {
          toast.error('No account linked to this Telegram. Please sign up first or link your Telegram in settings.');
        } else {
          toast.info('Opening Telegram bot to complete signup...');
          window.open('https://t.me/AfuChatBot?start=signup', '_blank');
        }
      }
    } catch (error: any) {
      console.error('Telegram auth error:', error);
      toast.error(error.message || 'Failed to authenticate with Telegram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base"
          disabled={disabled}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Continue with Telegram
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? 'Sign in with Telegram' : 'Sign up with Telegram'}
          </DialogTitle>
          <DialogDescription>
            Enter your Telegram username or phone number to {mode === 'signin' ? 'sign in' : 'create an account'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="telegram-input">Telegram Username or Phone</Label>
            <Input
              id="telegram-input"
              placeholder="@username or +1234567890"
              value={telegramInput}
              onChange={(e) => setTelegramInput(e.target.value)}
              className="h-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTelegramAuth();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Make sure your account is linked via our Telegram bot @AfuChatBot
            </p>
          </div>
          <Button
            onClick={handleTelegramAuth}
            disabled={loading || !telegramInput.trim()}
            className="w-full h-12"
          >
            {loading ? 'Verifying...' : mode === 'signin' ? 'Sign In' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramLoginButton;
