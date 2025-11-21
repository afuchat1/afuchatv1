import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { GiftImage } from './GiftImage';
import { GiftDetailSheet } from './GiftDetailSheet';
import { extractText } from '@/lib/textUtils';

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
  const [gifts, setGifts] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [giftStats, setGiftStats] = useState<Record<string, GiftStatistics>>({});
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    fetchGifts();
    fetchProfileName();

    // Set up real-time subscription for new gifts
    const channel = supabase
      .channel('gift-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gift_transactions',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New gift received:', payload);
          // Fetch updated gifts when a new one is received
          fetchGifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
        .select('gift_id, price_multiplier, total_sent')
        .in('gift_id', giftIds);

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

      const total = formattedGifts.reduce((sum, g) => sum + g.xp_cost, 0);
      setTotalValue(total);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (giftId: string, baseCost: number) => {
    const stats = giftStats[giftId];
    if (!stats) return baseCost;
    return Math.ceil(baseCost * stats.price_multiplier);
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
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-xs truncate">{gift.gift.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">{gift.gift.base_xp_cost || gift.xp_cost} XP</p>
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-bold text-primary">
                    {calculatePrice(gift.gift_id, gift.gift.base_xp_cost || gift.xp_cost).toLocaleString()} XP
                  </span>
                  {giftStats[gift.gift_id] && giftStats[gift.gift_id].price_multiplier !== 1 && (
                    <div className="flex items-center gap-0.5 text-[10px] text-green-500">
                      <TrendingUp className="h-2.5 w-2.5" />
                      <span>{((giftStats[gift.gift_id].price_multiplier * 100) - 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                {giftStats[gift.gift_id] && giftStats[gift.gift_id].total_sent > 0 && (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>{giftStats[gift.gift_id].total_sent.toLocaleString()}</span>
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
