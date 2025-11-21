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
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { GiftImage } from './GiftImage';
import { GiftConfetti } from './GiftConfetti';
import { ComboConfetti } from './ComboConfetti';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface PreviewGift extends GiftItem {
  current_price: number;
  total_sent: number;
  price_multiplier: number;
}

export const SendGiftDialog = ({ receiverId, receiverName, trigger }: SendGiftDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
  const [previewGift, setPreviewGift] = useState<PreviewGift | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'epic': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'rare': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'uncommon': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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

  const handlePreviewGift = (gift: GiftItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
    const stats = giftStats[gift.id];
    
    setPreviewGift({
      ...gift,
      current_price: currentPrice,
      total_sent: stats?.total_sent || 0,
      price_multiplier: stats?.price_multiplier || 1,
    });
    setShowPreview(true);
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
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverId}`} />
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

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
          {gifts.map((gift) => {
            const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
            const isSelected = selectedGift?.id === gift.id;
            const stats = giftStats[gift.id];
            const priceMultiplier = stats?.price_multiplier || 1;
            const totalSent = stats?.total_sent || 0;

            return (
              <div
                key={gift.id}
                className="relative"
              >
                <div
                  onClick={() => !loading && handleGiftTap(gift)}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 group relative p-1.5 sm:p-2 rounded-lg ${
                    isSelected
                      ? 'ring-2 ring-primary shadow-lg bg-primary/10 scale-105'
                      : 'hover:shadow-md hover:ring-1 hover:ring-primary/30 bg-card'
                  }`}
                >
                  {isSelected && selectedGift && (
                    <div className="absolute -top-1 -right-1 z-10 bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center font-bold text-[10px] shadow-lg animate-[scale-in_0.2s_ease-out]">
                      {selectedGift.count}
                    </div>
                  )}
                  
                  <div className="relative space-y-1">
                    <div className="relative">
                      <GiftImage
                        giftId={gift.id}
                        giftName={gift.name}
                        emoji={gift.emoji}
                        rarity={gift.rarity}
                        size="md"
                        className="mx-auto"
                      />
                      <Badge className={`absolute -top-1 -right-1 ${getRarityColor(gift.rarity)} text-[8px] px-1 py-0`}>
                        {gift.rarity.slice(0, 1)}
                      </Badge>
                    </div>

                    <div className="text-center">
                      <h3 className="font-semibold text-[10px] truncate">{gift.name}</h3>
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="text-[10px] font-bold text-primary">
                          {currentPrice.toLocaleString()}
                        </span>
                        {priceMultiplier !== 1 && (
                          <TrendingUp className="h-2 w-2 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-1 -left-1 h-5 w-5 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background z-20"
                  onClick={(e) => handlePreviewGift(gift, e)}
                >
                  <span className="text-[10px]">👁️</span>
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewGift && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GiftImage
                  giftId={previewGift.id}
                  giftName={previewGift.name}
                  emoji={previewGift.emoji}
                  rarity={previewGift.rarity}
                  size="sm"
                />
                {previewGift.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <GiftImage
                  giftId={previewGift.id}
                  giftName={previewGift.name}
                  emoji={previewGift.emoji}
                  rarity={previewGift.rarity}
                  size="lg"
                />
              </div>
              
              <div className="space-y-2">
                <Badge className={getRarityColor(previewGift.rarity)}>
                  {previewGift.rarity}
                </Badge>
                
                {previewGift.description && (
                  <p className="text-sm text-muted-foreground">{previewGift.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Base Cost</div>
                    <div className="font-bold">{previewGift.base_xp_cost} XP</div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Current Price</div>
                    <div className="font-bold text-primary">{previewGift.current_price} XP</div>
                  </div>
                  
                  {previewGift.price_multiplier !== 1 && (
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground">Multiplier</div>
                      <div className="font-bold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        {(previewGift.price_multiplier * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                  
                  {previewGift.total_sent > 0 && (
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground">Total Sent</div>
                      <div className="font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {previewGift.total_sent.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => {
                  setShowPreview(false);
                  handleGiftTap(previewGift);
                }}
              >
                <Gift className="h-4 w-4 mr-2" />
                Select Gift
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
