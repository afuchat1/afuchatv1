import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { GiftImage } from '@/components/gifts/GiftImage';

interface Gift {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  base_xp_cost: number;
  rarity: string;
  season: string | null;
  available_from: string | null;
  available_until: string | null;
}

interface GiftWithStats extends Gift {
  current_price: number;
  total_sent: number;
  price_multiplier: number;
}

interface OwnedGift {
  gift: Gift;
  received_count: number;
  last_received: string;
}

const Gifts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allGifts, setAllGifts] = useState<GiftWithStats[]>([]);
  const [ownedGifts, setOwnedGifts] = useState<OwnedGift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
    if (user) {
      fetchOwnedGifts();
    }
  }, [user]);

  const fetchGifts = async () => {
    try {
      const { data: gifts, error: giftsError } = await supabase
        .from('gifts')
        .select('*')
        .order('base_xp_cost', { ascending: true });

      if (giftsError) throw giftsError;

      const { data: stats, error: statsError } = await supabase
        .from('gift_statistics')
        .select('*');

      if (statsError) throw statsError;

      const giftsWithStats = gifts?.map(gift => {
        const stat = stats?.find(s => s.gift_id === gift.id);
        const currentPrice = Math.round(gift.base_xp_cost * (stat?.price_multiplier || 1));
        
        return {
          ...gift,
          current_price: currentPrice,
          total_sent: stat?.total_sent || 0,
          price_multiplier: stat?.price_multiplier || 1
        };
      }) || [];

      setAllGifts(giftsWithStats);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      toast.error('Failed to load gifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnedGifts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('gift_id, created_at, gifts(*)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const giftMap = new Map<string, OwnedGift>();
      
      data?.forEach(transaction => {
        if (transaction.gifts) {
          const giftId = transaction.gift_id;
          if (giftMap.has(giftId)) {
            const existing = giftMap.get(giftId)!;
            existing.received_count++;
            if (transaction.created_at > existing.last_received) {
              existing.last_received = transaction.created_at;
            }
          } else {
            giftMap.set(giftId, {
              gift: transaction.gifts as unknown as Gift,
              received_count: 1,
              last_received: transaction.created_at
            });
          }
        }
      });

      setOwnedGifts(Array.from(giftMap.values()));
    } catch (error) {
      console.error('Error fetching owned gifts:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'epic': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'rare': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'uncommon': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleGiftClick = (giftId: string) => {
    navigate(`/gifts/${giftId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-4">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gifts</h1>
              <p className="text-sm text-muted-foreground">Send special gifts to friends</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">All Gifts</TabsTrigger>
            <TabsTrigger value="owned">My Collection</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allGifts.map(gift => (
                <div
                  key={gift.id}
                  className="cursor-pointer transition-all duration-300 hover:scale-110 group relative"
                  onClick={() => handleGiftClick(gift.id)}
                >
                  <div className="relative space-y-2">
                    <div className="relative">
                      <GiftImage
                        giftId={gift.id}
                        giftName={gift.name}
                        emoji={gift.emoji}
                        rarity={gift.rarity}
                        size="lg"
                        className="mx-auto drop-shadow-2xl group-hover:drop-shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                      />
                      <Badge className={`absolute top-0 right-0 ${getRarityColor(gift.rarity)} text-[10px]`}>
                        {gift.rarity}
                      </Badge>
                    </div>

                    <div className="text-center">
                      <h3 className="font-semibold text-sm truncate">{gift.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {gift.description || 'A special gift'}
                      </p>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-primary">
                          {gift.current_price.toLocaleString()} XP
                        </span>
                        {gift.price_multiplier !== 1 && (
                          <div className="flex items-center gap-1 text-xs text-green-500">
                            <TrendingUp className="h-3 w-3" />
                            <span>{(gift.price_multiplier * 100 - 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>

                      {gift.total_sent > 0 && (
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          <span>{gift.total_sent.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="owned" className="space-y-6">
            {!user ? (
              <Card className="p-8 text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sign in to view your collection</h3>
                <p className="text-sm text-muted-foreground">
                  Log in to see all the gifts you've received
                </p>
              </Card>
            ) : ownedGifts.length === 0 ? (
              <Card className="p-8 text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No gifts yet</h3>
                <p className="text-sm text-muted-foreground">
                  You haven't received any gifts yet. Start connecting with friends!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {ownedGifts.map(({ gift, received_count, last_received }) => (
                  <div
                    key={gift.id}
                    className="cursor-pointer transition-all duration-300 hover:scale-110 group relative"
                    onClick={() => handleGiftClick(gift.id)}
                  >
                    <div className="space-y-2">
                      <div className="relative">
                        <GiftImage
                          giftId={gift.id}
                          giftName={gift.name}
                          emoji={gift.emoji}
                          rarity={gift.rarity}
                          size="lg"
                          className="mx-auto drop-shadow-2xl group-hover:drop-shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                        />
                        <Badge variant="secondary" className="absolute top-0 right-0 text-xs font-bold">
                          x{received_count}
                        </Badge>
                      </div>

                      <div className="text-center">
                        <h3 className="font-semibold text-sm truncate">{gift.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(last_received).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gifts;
