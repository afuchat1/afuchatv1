import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, Lock, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SimpleGiftIcon } from './SimpleGiftIcon';
import { GiftConfetti } from './GiftConfetti';
import { ComboConfetti } from './ComboConfetti';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useNavigate } from 'react-router-dom';

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
  const { tier, isPremium } = useSubscription();
  const { t } = useTranslation();
  const { avatarConfig } = useUserAvatar(receiverId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [giftStats, setGiftStats] = useState<Record<string, GiftStatistics>>({});
  const [selectedGift, setSelectedGift] = useState<SelectedGift | null>(null);
  const [loading, setLoading] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showComboConfetti, setShowComboConfetti] = useState(false);
  const [sentGiftEmojis, setSentGiftEmojis] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchGifts();
      fetchUserXP();
    } else {
      // Reset state when dialog closes
      setSelectedGift(null);
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

  const handleGiftTap = (gift: GiftItem) => {
    // Check if rare gift requires premium
    const isRareGift = gift.rarity === 'rare' || gift.rarity === 'epic' || gift.rarity === 'legendary';
    if (isRareGift && !isPremium) {
      toast.error('Rare gifts require Premium subscription!', {
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/subscription'),
        },
      });
      return;
    }

    const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);

    if (!selectedGift || selectedGift.id !== gift.id) {
      // Start new combo or switch gift
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
    } else {
      // Increment count for same gift (double-tap combo)
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
    }
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

  const handleSendGift = async () => {
    if (!selectedGift || !user) return;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={avatarConfig ? undefined : `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverId}`} />
              <AvatarFallback>{receiverName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{t('gifts.sendGiftTo', { name: receiverName })}</DialogTitle>
              <DialogDescription className="text-xs">
                {t('gifts.yourXP', { xp: userXP })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {selectedGift && (
          <div className="mb-4 text-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 border border-primary/20">
            <div className="space-y-2">
              <div className="text-lg font-bold text-foreground">
                {selectedGift.count}x {selectedGift.emoji} 
                {selectedGift.count > 1 && <span className="text-primary ml-1">COMBO!</span>}
              </div>
              {discount > 0 && (
                <div className="text-sm text-primary font-semibold">
                  {t('gifts.comboDiscount', { percent: (discount * 100).toFixed(0) })} 
                </div>
              )}
              <div className="text-base font-bold text-foreground">{totalCost} XP</div>
              <Button 
                onClick={handleSendGift} 
                disabled={loading}
                className="mt-2 w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('gifts.sending')}
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    {t('gifts.send')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground mb-4 bg-muted/30 rounded-lg p-2">
          {t('gifts.tapToCombo')}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {gifts.map((gift) => {
            const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
            const isSelected = selectedGift?.id === gift.id;
            const isRareGift = gift.rarity === 'rare' || gift.rarity === 'epic' || gift.rarity === 'legendary';
            const isLocked = isRareGift && !isPremium;

            return (
              <div
                key={gift.id}
                onClick={() => !loading && handleGiftTap(gift)}
                className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                  isLocked 
                    ? 'opacity-60 hover:opacity-80 bg-muted border-border/30'
                    : isSelected
                    ? 'ring-2 ring-primary shadow-lg bg-primary/10 border-primary scale-105'
                    : 'hover:shadow-md hover:scale-105 hover:ring-1 hover:ring-primary/30 border-border/50 bg-card'
                }`}
              >
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50 backdrop-blur-sm rounded-lg">
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[8px] px-1 py-0">
                        <Sparkles className="w-2 h-2 mr-0.5" />
                        Premium
                      </Badge>
                    </div>
                  </div>
                )}
                {isSelected && selectedGift && (
                  <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs shadow-lg animate-[scale-in_0.2s_ease-out]">
                    {selectedGift.count}
                  </div>
                )}
                <SimpleGiftIcon 
                  emoji={gift.emoji}
                  size={32}
                />
                <div className="text-center w-full">
                  <div className="text-[10px] font-semibold text-foreground truncate w-full leading-tight">
                    {gift.name}
                  </div>
                  <div className="text-[10px] font-bold text-primary mt-0.5">
                    {currentPrice} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
};
