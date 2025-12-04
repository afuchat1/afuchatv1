import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Link2, Unlink, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const TelegramLinking = () => {
  const { user } = useAuth();
  const [linkedTelegram, setLinkedTelegram] = useState<any>(null);
  const [linkCode, setLinkCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTelegramLink = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_linked', true)
        .single();
      
      if (!error && data) {
        setLinkedTelegram(data);
      }
      setIsLoading(false);
    };
    
    fetchTelegramLink();
  }, [user]);

  const generateLinkCode = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    
    try {
      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Check if user already has a telegram entry
      const { data: existingEntry } = await supabase
        .from('telegram_users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (existingEntry) {
        // Update existing entry
        await supabase
          .from('telegram_users')
          .update({
            link_token: code,
            link_token_expires_at: expiresAt.toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new entry with placeholder telegram_id (will be updated when user links from Telegram)
        // Use a negative timestamp as unique placeholder
        const placeholderTelegramId = -Date.now();
        await supabase
          .from('telegram_users')
          .insert({
            telegram_id: placeholderTelegramId,
            user_id: user.id,
            link_token: code,
            link_token_expires_at: expiresAt.toISOString(),
            is_linked: false
          });
      }
      
      setLinkCode(code);
      toast.success('Link code generated! Valid for 10 minutes.');
    } catch (error) {
      console.error('Error generating link code:', error);
      toast.error('Failed to generate link code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLinkCode = () => {
    navigator.clipboard.writeText(linkCode);
    toast.success('Code copied to clipboard!');
  };

  const unlinkTelegram = async () => {
    if (!user || !linkedTelegram) return;
    
    try {
      await supabase
        .from('telegram_users')
        .update({ 
          user_id: null, 
          is_linked: false,
          link_token: null,
          link_token_expires_at: null
        })
        .eq('id', linkedTelegram.id);
      
      setLinkedTelegram(null);
      toast.success('Telegram account unlinked successfully');
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast.error('Failed to unlink Telegram');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Telegram</h3>
        </div>
        <div className="animate-pulse h-20 bg-muted rounded-lg" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#0088cc]/10 rounded-lg">
          <MessageCircle className="h-5 w-5 text-[#0088cc]" />
        </div>
        <h3 className="text-xl font-semibold">Telegram</h3>
      </div>
      
      {linkedTelegram ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-600 dark:text-green-400">Account Linked</p>
                <p className="text-sm text-muted-foreground">
                  {linkedTelegram.telegram_username 
                    ? `@${linkedTelegram.telegram_username}` 
                    : `${linkedTelegram.telegram_first_name || ''} ${linkedTelegram.telegram_last_name || ''}`.trim()}
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={unlinkTelegram}
            className="w-full"
          >
            <Unlink className="h-4 w-4 mr-2" />
            Unlink Telegram
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground mb-3">
              Link your Telegram account to access AfuChat features through our bot.
            </p>
            
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside mb-4">
              <li>Open <a href="https://t.me/AfuChatBot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@AfuChatBot</a> on Telegram</li>
              <li>Generate a link code below</li>
              <li>Click "Link Account" in the bot and enter the code</li>
            </ol>
          </div>
          
          {linkCode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input 
                  value={linkCode} 
                  readOnly 
                  className="font-mono text-lg text-center tracking-widest"
                />
                <Button variant="outline" size="icon" onClick={copyLinkCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Code expires in 10 minutes
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateLinkCode}
                disabled={isGenerating}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate New Code
              </Button>
            </div>
          ) : (
            <Button 
              onClick={generateLinkCode}
              disabled={isGenerating}
              className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90"
            >
              <Link2 className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate Link Code
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
