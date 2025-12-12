import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, TrendingUp, Sparkles, Pin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { GiftImage } from './GiftImage';
import { GiftDetailSheet } from './GiftDetailSheet';
import { extractText } from '@/lib/textUtils';
import { toast } from 'sonner';

interface GiftTransaction {
  id: string;
  xp_cost: number;
  message: string | null;
  created_at: string;
  gift_id: string;
  sender: {
    display_name: string;
    handle: string;
  };
  gift: {
    id: string;
    name: string;
    emoji: string;
    rarity: string;
    description?: string;
    base_xp_cost?: number;
  };
}

interface GiftStatistics {
  price_multiplier: number;
  total_sent: number;
  last_sale_price?: number | null;
}

interface ReceivedGiftsProps {
  userId: string;
}

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'epic': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'rare': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'uncommon': return 'bg-green-500/10 text-green-500 border-green-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const ReceivedGifts = ({ userId }: ReceivedGiftsProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [giftStats, setGiftStats] = useState<Record<string, GiftStatistics>>({});
  const [profileName, setProfileName] = useState<string>('');
  const [pinnedGiftIds, setPinnedGiftIds] = useState<Set<string>>(new Set());
  
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    fetchGifts();
    fetchProfileName();
    if (isOwnProfile) {
      fetchPinnedGifts();
    }

    // Real-time subscription for new gifts
    const subscription = supabase
      .channel('gift_transactions_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'gift_transactions',
        filter: `receiver_id=eq.${userId}`
      }, () => {
        fetchGifts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, isOwnProfile]);

  const fetchPinnedGifts = async () => {
    const { data } = await supabase
      .from('pinned_gifts')
      .select('gift_id')
      .eq('user_id', userId);
    
    if (data) {
      setPinnedGiftIds(new Set(data.map(p => p.gift_id)));
    }
  };

  const fetchProfileName = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    if (data) {
      setProfileName(data.display_name);
    }
  };

  const fetchGifts = async () => {
    try {
      // Fetch gift transactions
      const { data: transactions, error: transError } = await supabase
        .from('gift_transactions')
        .select('id, xp_cost, message, created_at, sender_id, receiver_id, gift_id')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transError) throw transError;
      if (!transactions || transactions.length === 0) {
        setGifts([]);
        setTotalValue(0);
        setLoading(false);
        return;
      }

      // Get unique sender and gift IDs
      const senderIds = [...new Set(transactions.map(t => t.sender_id))];
      const giftIds = [...new Set(transactions.map(t => t.gift_id))];

      // Fetch sender profiles
      const { data: senders, error: senderError } = await supabase
        .from('profiles')
        .select('id, display_name, handle')
        .in('id', senderIds);

      if (senderError) throw senderError;

      // Fetch gift details
      const { data: giftDetails, error: giftError } = await supabase
        .from('gifts')
        .select('id, name, emoji, rarity, description, base_xp_cost')
        .in('id', giftIds);

      if (giftError) throw giftError;

      // Fetch gift statistics
      const { data: statsData } = await supabase
        .from('gift_statistics')
        .select('gift_id, price_multiplier, total_sent, last_sale_price')
        .in('gift_id', giftIds);

      if (statsData) {
        const statsMap: Record<string, GiftStatistics> = {};
        statsData.forEach((stat: any) => {
          statsMap[stat.gift_id] = {
            price_multiplier: parseFloat(stat.price_multiplier),
            total_sent: stat.total_sent,
            last_sale_price: stat.last_sale_price,
          };
        });
        setGiftStats(statsMap);
      }

      // Create lookup maps
      const senderMap = new Map(senders?.map(s => [s.id, s]) || []);
      const giftMap = new Map(giftDetails?.map(g => [g.id, g]) || []);

      // Format gifts with joined data
      const formattedGifts = transactions.map((item) => ({
        id: item.id,
        xp_cost: item.xp_cost,
        message: item.message,
        created_at: item.created_at,
        gift_id: item.gift_id,
        sender: senderMap.get(item.sender_id) || { display_name: 'Unknown', handle: 'unknown' },
        gift: giftMap.get(item.gift_id) || { id: item.gift_id, name: 'Unknown Gift', emoji: '🎁', rarity: 'common' },
      }));

      setGifts(formattedGifts);

      // Calculate total value using current dynamic prices (last_sale_price or base_xp_cost)
      const statsMap = statsData ? new Map(statsData.map((s: any) => [s.gift_id, s])) : new Map();
      const total = formattedGifts.reduce((sum, g) => {
        const stats = statsMap.get(g.gift_id);
        const baseCost = (g.gift as any).base_xp_cost || g.xp_cost;
        const currentPrice = stats?.last_sale_price || baseCost;
        return sum + currentPrice;
      }, 0);
      setTotalValue(total);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinToggle = async (e: React.MouseEvent, giftId: string) => {
    e.stopPropagation();
    
    if (pinnedGiftIds.has(giftId)) {
      const { error } = await supabase
        .from('pinned_gifts')
        .delete()
        .eq('user_id', userId)
        .eq('gift_id', giftId);
      
      if (!error) {
        setPinnedGiftIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(giftId);
          return newSet;
        });
        toast.success('Gift unpinned');
      }
    } else {
      if (pinnedGiftIds.size >= 6) {
        toast.error('You can only pin up to 6 gifts');
        return;
      }
      
      const { error } = await supabase
        .from('pinned_gifts')
        .insert({ user_id: userId, gift_id: giftId });
      
      if (!error) {
        setPinnedGiftIds(prev => new Set(prev).add(giftId));
        toast.success('Gift pinned to profile');
      }
    }
  };
  
  const isRareGift = (rarity: string) => {
    return ['rare', 'epic', 'legendary'].includes(rarity.toLowerCase());
  };

  const calculatePrice = (giftId: string, baseCost: number) => {
    const stats = giftStats[giftId];
    // Use last_sale_price if available, otherwise use base cost
    if (stats?.last_sale_price) return stats.last_sale_price;
    return baseCost;
  };

  const handleGiftClick = (gift: GiftTransaction) => {
    setSelectedGiftId(gift.gift.id);
    setDetailsSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {t('gifts.noGiftsReceived')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-border/50 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('gifts.giftsReceived', { count: gifts.length })}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('gifts.totalValue', { value: totalValue })}
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Gift className="h-12 w-12 text-primary relative" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        {gifts.map((gift) => (
          <div 
            key={gift.id} 
            onClick={() => handleGiftClick(gift)}
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 group relative p-2 sm:p-4"
          >
            <div className="relative space-y-2">
              <div className="relative">
                <GiftImage
                  giftId={gift.gift.id}
                  giftName={gift.gift.name}
                  emoji={gift.gift.emoji}
                  rarity={gift.gift.rarity}
                  size="lg"
                  className="mx-auto"
                />
                <Badge className={`absolute -top-2 -right-2 ${getRarityColor(gift.gift.rarity)} text-[10px] px-1.5 py-0.5`}>
                  {gift.gift.rarity}
                </Badge>
                {isOwnProfile && isRareGift(gift.gift.rarity) && (
                  <Button
                    size="sm"
                    variant={pinnedGiftIds.has(gift.gift.id) ? 'default' : 'ghost'}
                    className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handlePinToggle(e, gift.gift.id)}
                  >
                    <Pin className={`h-3 w-3 ${pinnedGiftIds.has(gift.gift.id) ? 'fill-current' : ''}`} />
                  </Button>
                )}
              </div>

              <div className="text-center max-w-full overflow-hidden">
                <h3 className="font-semibold text-xs truncate max-w-[80px] mx-auto" title={gift.gift.name}>{gift.gift.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Base: {gift.gift.base_xp_cost || gift.xp_cost} Nexa
                </p>
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-bold text-primary">
                    {calculatePrice(gift.gift_id, gift.gift.base_xp_cost || gift.xp_cost).toLocaleString()} Nexa
                  </span>
                </div>
                
                {(() => {
                  const currentPrice = calculatePrice(gift.gift_id, gift.gift.base_xp_cost || gift.xp_cost);
                  const basePrice = gift.gift.base_xp_cost || gift.xp_cost;
                  const percentIncrease = ((currentPrice - basePrice) / basePrice * 100).toFixed(1);
                  
                  return currentPrice > basePrice ? (
                    <div className="flex items-center justify-center gap-0.5 text-[10px] text-green-500 font-semibold">
                      <TrendingUp className="h-2.5 w-2.5" />
                      <span>+{percentIncrease}%</span>
                    </div>
                  ) : null;
                })()}

                {giftStats[gift.gift_id] && giftStats[gift.gift_id].total_sent > 0 && (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>{giftStats[gift.gift_id].total_sent.toLocaleString()} sent</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <GiftDetailSheet
        giftId={selectedGiftId}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        recipientId={userId}
        recipientName={profileName}
      />
    </div>
  );
};
