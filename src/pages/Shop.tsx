import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, ShoppingBag, Check, Sparkles, Zap, Clock, Hammer, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  item_type: 'accessory' | 'theme' | 'effect' | 'badge';
  xp_cost: number;
  emoji: string;
  config: any;
  is_featured?: boolean;
  discount_percentage?: number;
  featured_end_date?: string;
  is_auction?: boolean;
  auction_end_time?: string;
  starting_bid?: number;
  current_bid?: number;
  min_bid_increment?: number;
}

interface Bid {
  id: string;
  shop_item_id: string;
  user_id: string;
  bid_amount: number;
  created_at: string;
}

interface UserPurchase {
  shop_item_id: string;
}

export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [auctionItems, setAuctionItems] = useState<ShopItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);

  useEffect(() => {
    fetchShopData();
  }, [user]);

  const fetchShopData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch auction items
      const { data: auctionData, error: auctionError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_auction', true)
        .eq('is_available', true)
        .gte('auction_end_time', new Date().toISOString())
        .order('auction_end_time', { ascending: true });

      if (auctionError) throw auctionError;

      setAuctionItems((auctionData || []) as ShopItem[]);

      // Fetch bids for auction items
      if (auctionData && auctionData.length > 0) {
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .in('shop_item_id', auctionData.map(item => item.id))
          .order('created_at', { ascending: false });

        if (!bidsError && bidsData) {
          const bidsByItem: Record<string, Bid[]> = {};
          bidsData.forEach((bid: any) => {
            if (!bidsByItem[bid.shop_item_id]) {
              bidsByItem[bid.shop_item_id] = [];
            }
            bidsByItem[bid.shop_item_id].push(bid);
          });
          setBids(bidsByItem);
        }
      }

      // Fetch featured items
      const { data: featuredData, error: featuredError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_featured', true)
        .eq('is_available', true)
        .eq('is_auction', false)
        .gte('featured_end_date', new Date().toISOString())
        .order('discount_percentage', { ascending: false });

      if (featuredError) throw featuredError;

      setFeaturedItems((featuredData || []) as ShopItem[]);

      // Fetch regular shop items
      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_available', true)
        .eq('is_auction', false)
        .order('xp_cost', { ascending: true});

      if (itemsError) throw itemsError;

      setItems((itemsData || []) as ShopItem[]);

      // Fetch user purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('user_shop_purchases')
        .select('shop_item_id')
        .eq('user_id', user.id);

      if (purchasesError) throw purchasesError;

      // Fetch user XP
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;


      setPurchases(purchasesData || []);
      setUserXP(profileData?.xp || 0);
    } catch (error) {
      console.error('Error fetching shop data:', error);
      toast.error('Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId: string, itemName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setPurchasing(itemId);
    try {
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_shop_item_id: itemId,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; new_xp?: number };

      if (result.success) {
        toast.success(`Purchased ${itemName}!`);
        setUserXP(result.new_xp || 0);
        fetchShopData();
        
        window.dispatchEvent(new CustomEvent('xp-updated', { 
          detail: { xp: result.new_xp } 
        }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedItem || !bidAmount) return;

    setPlacingBid(true);
    try {
      const amount = parseInt(bidAmount);
      const { data, error } = await supabase.rpc('place_bid', {
        p_shop_item_id: selectedItem.id,
        p_bid_amount: amount,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast.success('Bid placed successfully!');
        setBidDialogOpen(false);
        setBidAmount('');
        setSelectedItem(null);
        fetchShopData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bid error:', error);
      toast.error('Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };

  const openBidDialog = (item: ShopItem) => {
    setSelectedItem(item);
    const minBid = (item.current_bid || item.starting_bid || 0) + (item.min_bid_increment || 10);
    setBidAmount(minBid.toString());
    setBidDialogOpen(true);
  };

  const isOwned = (itemId: string) => {
    return purchases.some(p => p.shop_item_id === itemId);
  };

  const getItemsByType = (type: string) => {
    return items.filter(item => item.item_type === type);
  };

  const getDiscountedPrice = (item: ShopItem) => {
    if (item.discount_percentage && item.discount_percentage > 0) {
      return Math.floor(item.xp_cost * (1 - item.discount_percentage / 100));
    }
    return item.xp_cost;
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getBidCount = (itemId: string) => {
    return bids[itemId]?.length || 0;
  };

  const renderCompactCard = (item: ShopItem) => {
    const owned = isOwned(item.id);
    const discountedPrice = getDiscountedPrice(item);
    const canAfford = userXP >= discountedPrice;
    const isFeatured = item.is_featured && item.discount_percentage && item.discount_percentage > 0;
    const isAuction = item.is_auction;
    const bidCount = isAuction ? getBidCount(item.id) : 0;

    return (
      <Card 
        key={item.id}
        className={`relative overflow-hidden w-56 flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
          owned ? 'border-primary/50 bg-primary/5' : ''
        } ${isFeatured ? 'border-yellow-500/50 shadow-lg' : ''} ${
          isAuction ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5' : ''
        }`}
      >
        {/* Top badges */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          {owned && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Check className="w-3 h-3" />
              Owned
            </Badge>
          )}
          {isFeatured && (
            <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs">
              <Zap className="w-3 h-3" />
              {item.discount_percentage}% OFF
            </Badge>
          )}
          {isAuction && (
            <Badge className="gap-1 bg-purple-500 hover:bg-purple-600 text-white text-xs">
              <Hammer className="w-3 h-3" />
              Auction
            </Badge>
          )}
        </div>

        {/* Emoji/Image */}
        <div className="h-32 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 relative">
          <div className="text-6xl">{item.emoji}</div>
          {isAuction && item.auction_end_time && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
              <div className="flex items-center justify-center gap-1 text-xs text-white">
                <Clock className="w-3 h-3" />
                {getTimeRemaining(item.auction_end_time)}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <div>
            <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          </div>

          {/* Auction Info */}
          {isAuction ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Current Bid</span>
                <span className="font-bold text-purple-500">
                  {item.current_bid || item.starting_bid} XP
                </span>
              </div>
              {bidCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                </div>
              )}
              <Button
                onClick={() => openBidDialog(item)}
                disabled={owned}
                className="w-full h-8 text-xs"
                variant={owned ? 'outline' : 'default'}
              >
                {owned ? 'Owned' : 'Place Bid'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Price */}
              <div className="flex items-center justify-between">
                {isFeatured ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-primary text-sm">
                      {discountedPrice} XP
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {item.xp_cost} XP
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-primary text-sm">
                    {item.xp_cost} XP
                  </span>
                )}
              </div>

              {/* Featured countdown */}
              {isFeatured && item.featured_end_date && (
                <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <Clock className="w-3 h-3" />
                  {getTimeRemaining(item.featured_end_date)}
                </div>
              )}

              {/* Purchase button */}
              <Button
                onClick={() => handlePurchase(item.id, item.name)}
                disabled={owned || !canAfford || purchasing === item.id}
                variant={owned ? 'outline' : 'default'}
                className="w-full h-8 text-xs"
              >
                {purchasing === item.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : owned ? (
                  'Owned'
                ) : !canAfford ? (
                  'Need More XP'
                ) : (
                  'Purchase'
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderSection = (title: string, icon: React.ReactNode, items: ShopItem[], gradient?: string) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
          <Badge variant="outline" className="ml-auto">{items.length} items</Badge>
        </div>
        <div className={`${gradient ? `bg-gradient-to-r ${gradient} p-4 rounded-lg` : ''}`}>
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4">
              {items.map(item => renderCompactCard(item))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access the shop</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Badge variant="outline" className="gap-2 py-2 px-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold">{userXP} XP</span>
          </Badge>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            Cosmetic Shop
          </h1>
          <p className="text-muted-foreground">
            Purchase exclusive accessories and themes with your XP
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Auctions */}
            {renderSection(
              'Live Auctions',
              <Hammer className="w-6 h-6 text-purple-500" />,
              auctionItems,
              'from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20'
            )}

            {/* Featured Items */}
            {renderSection(
              'Limited Edition',
              <Zap className="w-6 h-6 text-yellow-500" />,
              featuredItems,
              'from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20'
            )}

            {/* All Items */}
            {renderSection(
              'All Items',
              <ShoppingBag className="w-6 h-6" />,
              items
            )}

            {/* Accessories */}
            {renderSection(
              'Accessories',
              <Sparkles className="w-6 h-6" />,
              getItemsByType('accessory')
            )}

            {/* Themes */}
            {renderSection(
              'Themes',
              <TrendingUp className="w-6 h-6" />,
              getItemsByType('theme')
            )}

            {/* Effects */}
            {renderSection(
              'Effects',
              <Zap className="w-6 h-6" />,
              getItemsByType('effect')
            )}

            {/* Badges */}
            {renderSection(
              'Badges',
              <Check className="w-6 h-6" />,
              getItemsByType('badge')
            )}
          </div>
        )}

        {/* Bid Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Place Your Bid</DialogTitle>
              <DialogDescription>
                {selectedItem && (
                  <>
                    Bidding on <strong>{selectedItem.name}</strong>
                    <div className="mt-2 text-sm">
                      Current bid: <strong>{selectedItem.current_bid || selectedItem.starting_bid} XP</strong>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Minimum bid: {(selectedItem.current_bid || selectedItem.starting_bid || 0) + (selectedItem.min_bid_increment || 10)} XP
                    </div>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bid Amount (XP)</label>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid"
                  min={(selectedItem?.current_bid || selectedItem?.starting_bid || 0) + (selectedItem?.min_bid_increment || 10)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Your XP: <strong>{userXP}</strong>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePlaceBid} disabled={placingBid || !bidAmount}>
                {placingBid ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Place Bid'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
