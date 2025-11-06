import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { PremiumGiftIcon } from './PremiumGiftIcon';

interface GiftTransaction {
  id: string;
  xp_cost: number;
  message: string | null;
  created_at: string;
  sender: {
    display_name: string;
    handle: string;
  };
  gift: {
    name: string;
    emoji: string;
    rarity: string;
  };
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
        .select('id, name, emoji, rarity')
        .in('id', giftIds);

      if (giftError) throw giftError;

      // Create lookup maps
      const senderMap = new Map(senders?.map(s => [s.id, s]) || []);
      const giftMap = new Map(giftDetails?.map(g => [g.id, g]) || []);

      // Format gifts with joined data
      const formattedGifts = transactions.map((item) => ({
        id: item.id,
        xp_cost: item.xp_cost,
        message: item.message,
        created_at: item.created_at,
        sender: senderMap.get(item.sender_id) || { display_name: 'Unknown', handle: 'unknown' },
        gift: giftMap.get(item.gift_id) || { name: 'Unknown Gift', emoji: '🎁', rarity: 'common' },
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
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{t('gifts.giftsReceived', { count: gifts.length })}</h3>
            <p className="text-sm text-muted-foreground">
              {t('gifts.totalValue', { value: totalValue })}
            </p>
          </div>
          <Gift className="h-10 w-10 text-pink-500" />
        </div>
      </Card>

      <div className="space-y-3">
        {gifts.map((gift) => (
          <Card key={gift.id} className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/30">
            <div className="flex items-start gap-3">
              <PremiumGiftIcon 
                emoji={gift.gift.emoji}
                rarity={gift.gift.rarity}
                size={56}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm">{gift.gift.name}</h4>
                  <Badge className={rarityColors[gift.gift.rarity]} variant="secondary">
                    {t(`gifts.${gift.gift.rarity}`)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {gift.xp_cost} {t('gamification.xp')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('common.from')}{' '}
                  <span className="font-medium text-foreground">
                    {gift.sender.display_name}
                  </span>{' '}
                  (@{gift.sender.handle})
                </p>
                {gift.message && (
                  <p className="text-xs mt-2 p-2 bg-muted/50 rounded italic border-l-2 border-primary/30">
                    "{gift.message}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(gift.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
