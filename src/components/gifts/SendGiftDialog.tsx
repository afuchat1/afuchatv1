import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Sparkles } from 'lucide-react';
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
      fetchUserNexa();
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

  const fetchUserNexa = async () => {
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
        toast.error(t('gifts.notEnoughNexa'));
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
        toast.error(t('gifts.notEnoughNexa'));
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
          
          const savedNexa = (result.original_cost || 0) - (result.discounted_cost || 0);
          toast.success(
            t('gifts.comboSent', { saved: savedNexa }),
            { description: result.new_grade ? `${t('gamification.grade')}: ${result.new_grade}` : undefined }
          );
          setOpen(false);
          setSelectedGift(null);
          fetchUserNexa();
          
          window.dispatchEvent(new CustomEvent('nexa-updated', { 
            detail: { nexa: result.new_xp, grade: result.new_grade } 
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
          fetchUserNexa();
          
          window.dispatchEvent(new CustomEvent('nexa-updated', { 
            detail: { nexa: result.new_xp, grade: result.new_grade } 
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
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-transform">
              <Gift className="h-4 w-4" />
              {t('gifts.sendGift')}
            </Button>
          )}
        </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto p-6 bg-gradient-to-b from-background via-background to-primary/5" onOpenChange={setOpen}>
        <SheetHeader className="pb-4 space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 shadow-lg">
            <Avatar className="h-14 w-14 ring-2 ring-primary/30 shadow-lg">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverId}`} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">{receiverName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{t('gifts.sendGiftTo', { name: receiverName })}</SheetTitle>
              <SheetDescription className="text-sm font-medium flex items-center gap-1.5 mt-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {t('gifts.yourNexa', { nexa: userXP.toLocaleString() })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>


        <div className="text-sm text-center text-muted-foreground mb-6 bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 rounded-xl p-3 border border-border/50">
          <span className="font-medium">💡 {t('gifts.tapToCombo')}</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-6">
          {gifts.map((gift) => {
            const currentPrice = calculatePrice(gift.id, gift.base_xp_cost);
            const isSelected = selectedGift?.id === gift.id;
            const stats = giftStats[gift.id];
            const priceMultiplier = stats?.price_multiplier || 1;
            const totalSent = stats?.total_sent || 0;

            return (
              <div
                key={gift.id}
                className="relative flex flex-col items-center gap-2"
              >
                {/* Gift Item - No Background */}
                <div
                  onClick={() => !loading && handleGiftTap(gift)}
                  className={`cursor-pointer transition-all duration-300 hover:scale-110 group relative ${
                    isSelected ? 'scale-125' : ''
                  }`}
                >
                  {/* Count Badge */}
                  {isSelected && selectedGift && (
                    <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs shadow-xl animate-[scale-in_0.2s_ease-out] ring-2 ring-background">
                      {selectedGift.count}
                    </div>
                  )}
                  
                  <div className="relative space-y-1.5">
                    {/* Gift Image */}
                    <div className="relative">
                      <GiftImage
                        giftId={gift.id}
                        giftName={gift.name}
                        emoji={gift.emoji}
                        rarity={gift.rarity}
                        size="md"
                        className={`mx-auto drop-shadow-lg transition-all duration-300 ${
                          isSelected ? 'scale-125' : ''
                        }`}
                      />
                      <Badge className={`absolute -top-1 -right-1 ${getRarityColor(gift.rarity)} text-[8px] px-1 py-0 shadow-md`}>
                        {gift.rarity.slice(0, 1)}
                      </Badge>
                    </div>

                    {/* Gift Info */}
                    <div className="text-center space-y-0.5">
                      <h3 className="font-semibold text-[11px] truncate text-foreground">{gift.name}</h3>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {currentPrice.toLocaleString()}
                        </span>
                        {priceMultiplier !== 1 && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg border border-border/50 z-20"
                    onClick={(e) => handlePreviewGift(gift, e)}
                  >
                    <span className="text-xs">👁️</span>
                  </Button>
                </div>

                {/* Send Button - Simple and Clean */}
                {isSelected && selectedGift && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendGift();
                    }}
                    disabled={loading}
                    size="sm"
                    className="h-8 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-full shadow-md hover:shadow-lg transition-all duration-200 animate-[scale-in_0.3s_ease-out]"
                  >
                    {loading ? t('gifts.sending') : t('gifts.send')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
      </Sheet>

      {/* Preview Sheet */}
      {previewGift && (
        <Sheet open={showPreview} onOpenChange={setShowPreview}>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto" onOpenChange={setShowPreview}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <GiftImage
                  giftId={previewGift.id}
                  giftName={previewGift.name}
                  emoji={previewGift.emoji}
                  rarity={previewGift.rarity}
                  size="sm"
                />
                {previewGift.name}
              </SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4 mt-4">
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
                    <div className="font-bold">{previewGift.base_xp_cost} Nexa</div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">Current Price</div>
                    <div className="font-bold text-primary">{previewGift.current_price} Nexa</div>
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
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
