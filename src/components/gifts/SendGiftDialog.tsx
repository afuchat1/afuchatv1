import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PremiumGiftIcon } from './PremiumGiftIcon';

interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  base_xp_cost: number;
  rarity: string;
  description: string;
  season?: string;
  available_from?: string;
  available_until?: string;
}

interface GiftStatistics {
  price_multiplier: number;
  total_sent: number;
}

interface SendGiftDialogProps {
  receiverId: string;
  receiverName: string;
  trigger?: React.ReactNode;
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
};

const seasonColors: Record<string, string> = {
  Valentine: 'bg-pink-500',
  Halloween: 'bg-orange-500',
  Christmas: 'bg-red-500',
};

const seasonEmojis: Record<string, string> = {
  Valentine: '💝',
  Halloween: '🎃',
  Christmas: '🎄',
};

export const SendGiftDialog = ({ receiverId, receiverName, trigger }: SendGiftDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [giftStats, setGiftStats] = useState<Record<string, GiftStatistics>>({});
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    if (open) {
      fetchGifts();
      fetchUserXP();
    }
  }, [open]);

  const fetchGifts = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: giftsData } = await supabase
      .from('gifts')
      .select('*')
      .or(`available_from.is.null,and(available_from.lte.${today},available_until.gte.${today})`)
      .order('base_xp_cost', { ascending: true });

    const { data: statsData } = await supabase
      .from('gift_statistics')
      .select('gift_id, price_multiplier, total_sent');

    if (giftsData) {
      setGifts(giftsData);
    }

    if (statsData) {
      const statsMap: Record<string, GiftStatistics> = {};
      statsData.forEach((stat: any) => {
        statsMap[stat.gift_id] = {
          price_multiplier: parseFloat(stat.price_multiplier),
          total_sent: stat.total_sent,
        };
      });
      setGiftStats(statsMap);
    }
  };

  const fetchUserXP = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .single();

    if (data) {
      setUserXP(data.xp);
    }
  };

  const calculatePrice = (giftId: string, baseCost: number) => {
    const stats = giftStats[giftId];
    if (!stats) return baseCost;
    return Math.ceil(baseCost * stats.price_multiplier);
  };

  const handleSendGift = async () => {
    if (!selectedGift || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_gift', {
        p_gift_id: selectedGift,
        p_receiver_id: receiverId,
        p_message: message.trim() || null,
      });

      if (error) throw error;

      const result = data as { 
        success: boolean; 
        message: string; 
        xp_cost?: number;
        new_xp?: number;
        new_grade?: string;
      };

      if (result.success) {
        toast.success(
          t('gifts.giftSent'),
          { description: result.new_grade ? `${t('gamification.grade')}: ${result.new_grade}` : undefined }
        );
        setOpen(false);
        setSelectedGift(null);
        setMessage('');
        fetchUserXP();
        
        // Trigger a profile refresh for the sender to show updated XP and grade
        window.dispatchEvent(new CustomEvent('xp-updated', { 
          detail: { xp: result.new_xp, grade: result.new_grade } 
        }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      toast.error(t('gifts.giftFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Gift className="h-4 w-4" />
            {t('gifts.sendGift')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('gifts.sendGiftTo', { name: receiverName })}</DialogTitle>
          <DialogDescription>
            {t('gifts.yourXP', { xp: userXP })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          {gifts.map((gift) => {
            const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
            const stats = giftStats[gift.id];
            const canAfford = userXP >= currentPrice;
            const isSelected = selectedGift === gift.id;

            return (
              <div
                key={gift.id}
                onClick={() => canAfford && setSelectedGift(gift.id)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xl'
                    : canAfford
                    ? 'border-border hover:border-primary/50'
                    : 'border-border opacity-50 cursor-not-allowed'
                }`}
              >
                {gift.season && (
                  <div className="absolute top-1 right-1 z-10">
                    <Badge className={`${seasonColors[gift.season]} text-white text-[10px] px-1 py-0`}>
                      {seasonEmojis[gift.season]} {gift.season}
                    </Badge>
                  </div>
                )}
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <PremiumGiftIcon 
                      emoji={gift.emoji}
                      rarity={gift.rarity}
                      season={gift.season}
                      size={80}
                    />
                  </div>
                  <h4 className="font-semibold text-sm">{gift.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
                    {gift.description}
                  </p>
                  <div className="mt-2 space-y-1">
                    <Badge className={rarityColors[gift.rarity]} variant="secondary">
                      {t(`gifts.${gift.rarity}`)}
                    </Badge>
                    <div className="text-sm font-bold">
                      {currentPrice} {t('gamification.xp')}
                      {stats && stats.price_multiplier > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (×{stats.price_multiplier.toFixed(2)})
                        </span>
                      )}
                    </div>
                    {stats && (
                      <p className="text-xs text-muted-foreground">
                        {t('gifts.sentTimes', { count: stats.total_sent })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedGift && (
          <div className="space-y-3">
            <Textarea
              placeholder={t('gifts.addMessage')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSendGift}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('gifts.sending')}
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  {t('gifts.sendGift')}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
