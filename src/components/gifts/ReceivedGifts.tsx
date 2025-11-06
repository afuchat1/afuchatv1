import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { SimpleGiftIcon } from './SimpleGiftIcon';
import { ReceivedGiftDetailsModal } from './ReceivedGiftDetailsModal';

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

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  legendary: 'bg-purple-500',
};

export const ReceivedGifts = ({ userId }: ReceivedGiftsProps) => {
  const { t } = useTranslation();
  const [gifts, setGifts] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedGift, setSelectedGift] = useState<GiftTransaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [giftStats, setGiftStats] = useState<Record<string, GiftStatistics>>({});

  useEffect(() => {
    fetchGifts();

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
    setSelectedGift(gift);
    setDetailsModalOpen(true);
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

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-6">
        {gifts.map((gift) => (
          <div 
            key={gift.id} 
            onClick={() => handleGiftClick(gift)}
            className="group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:ring-2 hover:ring-primary/30"
          >
            <SimpleGiftIcon 
              emoji={gift.gift.emoji}
              size={56}
            />
            <div className="text-center w-full space-y-1">
              <div className="text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors">
                {gift.gift.name}
              </div>
              <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {gift.xp_cost} XP
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGift && (
        <ReceivedGiftDetailsModal
          gift={selectedGift}
          currentPrice={calculatePrice(selectedGift.gift_id, selectedGift.gift.base_xp_cost || selectedGift.xp_cost)}
          totalSent={giftStats[selectedGift.gift_id]?.total_sent || 0}
          priceMultiplier={giftStats[selectedGift.gift_id]?.price_multiplier || 1}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </div>
  );
};
