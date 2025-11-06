import { useState, useEffect, useRef } from 'react';
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
import { Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SimpleGiftIcon } from './SimpleGiftIcon';
import { GiftConfetti } from './GiftConfetti';
import { ComboConfetti } from './ComboConfetti';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';

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

interface SelectedGift {
  id: string;
  emoji: string;
  count: number;
  baseCost: number;
}

export const SendGiftDialog = ({ receiverId, receiverName, trigger }: SendGiftDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { avatarConfig } = useUserAvatar(receiverId);
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [giftStats, setGiftStats] = useState<Record<string, GiftStatistics>>({});
  const [selectedGift, setSelectedGift] = useState<SelectedGift | null>(null);
  const [loading, setLoading] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showComboConfetti, setShowComboConfetti] = useState(false);
  const [sentGiftEmojis, setSentGiftEmojis] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [comboAnimation, setComboAnimation] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchGifts();
      fetchUserXP();
    } else {
      // Reset state when dialog closes
      setSelectedGift(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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

  const handleGiftTap = (gift: GiftItem) => {
    const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
    
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // If selecting a different gift, reset
    if (selectedGift && selectedGift.id !== gift.id) {
      setSelectedGift({
        id: gift.id,
        emoji: gift.emoji,
        count: 1,
        baseCost: currentPrice,
      });
    } else if (selectedGift) {
      // Increment count for same gift
      const newCount = selectedGift.count + 1;
      const totalCost = calculateComboTotalCost(gift.id, gift.base_xp_cost, newCount);
      
      if (totalCost > userXP) {
        toast.error(t('gifts.notEnoughXP'));
        return;
      }
      
      setSelectedGift({
        ...selectedGift,
        count: newCount,
      });
      
      // Show combo animation
      setComboAnimation(gift.id);
      setTimeout(() => setComboAnimation(null), 300);
    } else {
      // First selection
      if (currentPrice > userXP) {
        toast.error(t('gifts.notEnoughXP'));
        return;
      }
      
      setSelectedGift({
        id: gift.id,
        emoji: gift.emoji,
        count: 1,
        baseCost: currentPrice,
      });
    }

    // Start 5-second timer
    timerRef.current = setTimeout(() => {
      handleAutoSend();
    }, 5000);
  };

  const calculateComboDiscount = (giftCount: number) => {
    if (giftCount >= 6) return 0.15;
    if (giftCount >= 4) return 0.10;
    if (giftCount >= 2) return 0.05;
    return 0;
  };

  const calculateComboTotalCost = (giftId: string, baseCost: number, count: number) => {
    const pricePerGift = calculatePrice(giftId, baseCost);
    const totalBeforeDiscount = pricePerGift * count;
    const discount = calculateComboDiscount(count);
    return Math.ceil(totalBeforeDiscount * (1 - discount));
  };

  const handleAutoSend = async () => {
    if (!selectedGift || !user) return;

    // Clear timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setLoading(true);
    try {
      const giftIds = Array(selectedGift.count).fill(selectedGift.id);

      // Use combo function if multiple, otherwise single gift
      if (selectedGift.count > 1) {
        const { data, error } = await supabase.rpc('send_gift_combo', {
          p_gift_ids: giftIds,
          p_receiver_id: receiverId,
          p_message: null,
        });

        if (error) throw error;

        const result = data as {
          success: boolean;
          message: string;
          gift_count?: number;
          original_cost?: number;
          discounted_cost?: number;
          discount_percent?: number;
          new_xp?: number;
          new_grade?: string;
        };

        if (result.success) {
          setSentGiftEmojis(Array(selectedGift.count).fill(selectedGift.emoji));
          setShowComboConfetti(true);
          
          const savedXP = (result.original_cost || 0) - (result.discounted_cost || 0);
          toast.success(
            t('gifts.comboSent', { saved: savedXP }),
            { description: result.new_grade ? `${t('gamification.grade')}: ${result.new_grade}` : undefined }
          );
          setOpen(false);
          setSelectedGift(null);
          fetchUserXP();
          
          window.dispatchEvent(new CustomEvent('xp-updated', { 
            detail: { xp: result.new_xp, grade: result.new_grade } 
          }));
        } else {
          toast.error(result.message);
        }
      } else {
        // Single gift
        const { data, error } = await supabase.rpc('send_gift', {
          p_gift_id: selectedGift.id,
          p_receiver_id: receiverId,
          p_message: null,
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
          setSentGiftEmojis([selectedGift.emoji]);
          setShowConfetti(true);
          
          toast.success(
            t('gifts.giftSent'),
            { description: result.new_grade ? `${t('gamification.grade')}: ${result.new_grade}` : undefined }
          );
          setOpen(false);
          setSelectedGift(null);
          fetchUserXP();
          
          window.dispatchEvent(new CustomEvent('xp-updated', { 
            detail: { xp: result.new_xp, grade: result.new_grade } 
          }));
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      toast.error(t('gifts.giftFailed'));
    } finally {
      setLoading(false);
    }
  };

  const totalCost = selectedGift 
    ? calculateComboTotalCost(selectedGift.id, selectedGift.baseCost, selectedGift.count)
    : 0;
  const discount = selectedGift ? calculateComboDiscount(selectedGift.count) : 0;

  return (
    <>
      {showConfetti && (
        <GiftConfetti 
          emoji={sentGiftEmojis[0]} 
          onComplete={() => setShowConfetti(false)} 
        />
      )}
      
      {showComboConfetti && (
        <ComboConfetti 
          emojis={sentGiftEmojis}
          giftCount={sentGiftEmojis.length}
          onComplete={() => setShowComboConfetti(false)} 
        />
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <Gift className="h-4 w-4" />
              {t('gifts.sendGift')}
            </Button>
          )}
        </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={avatarConfig ? undefined : `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverId}`} />
              <AvatarFallback>{receiverName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{t('gifts.sendGiftTo', { name: receiverName })}</DialogTitle>
              <DialogDescription className="mt-1">
                {t('gifts.yourXP', { xp: userXP })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4 text-center bg-muted/30 rounded-lg p-3">
          {selectedGift ? (
            <div className="space-y-1">
              <div className="text-base font-semibold text-foreground">
                {selectedGift.count}x {selectedGift.emoji} Combo!
              </div>
              {discount > 0 && (
                <div className="text-primary font-medium">
                  {t('gifts.comboDiscount', { percent: (discount * 100).toFixed(0) })} • {totalCost} XP
                </div>
              )}
              {!discount && (
                <div className="text-foreground">{totalCost} XP</div>
              )}
              <div className="text-xs text-muted-foreground">
                Sending in {loading ? '...' : '5s'}...
              </div>
            </div>
          ) : (
            "Tap a gift multiple times to build a combo!"
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 my-6">
          {gifts.map((gift) => {
            const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
            const isSelected = selectedGift?.id === gift.id;
            const isAnimating = comboAnimation === gift.id;

            return (
              <div
                key={gift.id}
                onClick={() => !loading && handleGiftTap(gift)}
                className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center ${
                  isSelected
                    ? 'ring-4 ring-primary shadow-2xl shadow-primary/30 scale-110 bg-primary/10'
                    : 'hover:shadow-xl hover:scale-110 hover:ring-2 hover:ring-primary/20'
                } ${isAnimating ? 'animate-[scale-in_0.3s_ease-out]' : ''}`}
              >
                {isSelected && selectedGift && (
                  <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm shadow-lg animate-[scale-in_0.2s_ease-out]">
                    {selectedGift.count}
                  </div>
                )}
                <SimpleGiftIcon 
                  emoji={gift.emoji}
                  size={isSelected ? 64 : 56}
                />
              </div>
            );
          })}
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
};
