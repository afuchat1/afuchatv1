import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ShoppingBag, Check, Sparkles, Zap, Clock, Hammer, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

// --- Interface Definitions (Kept as provided) ---
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
  id?: string;
}

interface MarketplaceListing {
  id: string;
  user_id: string;
  shop_item_id: string;
  purchase_id: string;
  asking_price: number;
  created_at: string;
  shop_items?: {
    name: string;
    description: string;
    emoji: string;
    item_type: string;
  };
  profiles?: {
    display_name: string;
    handle: string;
  };
}
// --- End Interface Definitions ---


export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [auctionItems, setAuctionItems] = useState<ShopItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<ShopItem[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<UserPurchase | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'marketplace'>('shop');

  // --- Data Fetching and Real-time Effects (Logic Unchanged) ---

  useEffect(() => {
    fetchShopData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('bids-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids'
        },
        (payload) => {
          console.log('New bid received:', payload);
          const newBid = payload.new as Bid;
          
          setBids(prev => ({
            ...prev,
            [newBid.shop_item_id]: [newBid, ...(prev[newBid.shop_item_id] || [])]
          }));

          setAuctionItems(prev => 
            prev.map(item => 
              item.id === newBid.shop_item_id
                ? { ...item, current_bid: newBid.bid_amount }
                : item
            )
          );

          toast.info('New bid placed on an auction!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchShopData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date().toISOString();

      // Fetch auction items
      const { data: auctionData, error: auctionError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_auction', true)
        .eq('is_available', true)
        .gte('auction_end_time', now)
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
        .gte('featured_end_date', now)
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

      // Fetch marketplace listings
      const { data: marketplaceData, error: marketplaceError } = await supabase
        .from('marketplace_listings')
        .select(`*, shop_items (name, description, emoji, item_type), profiles (display_name, handle)`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (marketplaceError) throw marketplaceError;
      setMarketplaceListings((marketplaceData || []) as MarketplaceListing[]);

      // Fetch user purchases and XP
      const [{ data: purchasesData, error: purchasesError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase.from('user_shop_purchases').select('id, shop_item_id').eq('user_id', user.id),
        supabase.from('profiles').select('xp').eq('id', user.id).single()
      ]);

      if (purchasesError) throw purchasesError;
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
    // Debug Guard: Ensure Item ID is valid before calling RPC
    if (!itemId) {
      toast.error('Invalid item selected.');
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
        window.dispatchEvent(new CustomEvent('xp-updated', { detail: { xp: result.new_xp } }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to complete purchase. Check database logs.');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePlaceBid = async () => {
    const amount = parseInt(bidAmount);
    // Debug Guard: Ensure Item ID is valid and amount is a number
    if (!selectedItem || !selectedItem.id || isNaN(amount)) return;

    setPlacingBid(true);
    try {
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
      toast.error('Failed to place bid. Check database logs.');
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

  const openListDialog = (purchase: UserPurchase, item: ShopItem) => {
    setSelectedPurchase(purchase);
    setSelectedItem(item);
    setListingPrice('');
    setListDialogOpen(true);
  };

  const handleCreateListing = async () => {
    const price = parseInt(listingPrice);
    // Debug Guard: Ensure Purchase ID is valid and price is a number
    if (!selectedPurchase || !selectedPurchase.id || isNaN(price)) return;

    setPlacingBid(true);
    try {
      const { data, error } = await supabase.rpc('create_marketplace_listing', {
        p_purchase_id: selectedPurchase.id,
        p_asking_price: price,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast.success('Item listed on marketplace!');
        setListDialogOpen(false);
        setListingPrice('');
        setSelectedPurchase(null);
        setSelectedItem(null);
        fetchShopData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Listing error:', error);
      toast.error('Failed to create listing. Check database logs.');
    } finally {
      setPlacingBid(false);
    }
  };

  const handlePurchaseMarketplaceItem = async (listingId: string, itemName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Debug Guard: Ensure Listing ID is valid
    if (!listingId) {
      toast.error('Invalid listing selected.');
      return;
    }

    setPurchasing(listingId);
    try {
      const { data, error } = await supabase.rpc('purchase_marketplace_item', {
        p_listing_id: listingId,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; new_xp?: number };

      if (result.success) {
        toast.success(`Purchased ${itemName}!`);
        setUserXP(result.new_xp || 0);
        fetchShopData();
        window.dispatchEvent(new CustomEvent('xp-updated', { detail: { xp: result.new_xp } }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to complete purchase. Check database logs.');
    } finally {
      setPurchasing(null);
    }
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

  // --- Rendering Functions (Updated for Small, Rich Design) ---

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
        // Small width on mobile, rounded-xl for rich design
        className={`relative overflow-hidden w-full sm:w-36 flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl 
          ${owned ? 'border-primary/50 bg-primary/5' : ''} 
          ${isFeatured ? 'border-yellow-500/50 shadow-lg' : ''} 
          ${isAuction ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5' : ''}`
        }
      >
        {/* Top badges (Small text, tight spacing) */}
        <div className="absolute top-1 right-1 z-10 flex flex-col gap-0.5">
          {owned && (
            <Badge variant="secondary" className="gap-0.5 text-[10px] px-1 py-0.5">
              <Check className="w-2.5 h-2.5" /> Owned
            </Badge>
          )}
          {isFeatured && (
            <Badge className="gap-0.5 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] px-1 py-0.5">
              <Zap className="w-2.5 h-2.5" /> {item.discount_percentage}% OFF
            </Badge>
          )}
          {isAuction && (
            <Badge className="gap-0.5 bg-purple-500 hover:bg-purple-600 text-white text-[10px] px-1 py-0.5">
              <Hammer className="w-2.5 h-2.5" /> Auction
            </Badge>
          )}
        </div>

        {/* Emoji/Image (Reduced height and emoji size) */}
        <div className="h-20 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 relative">
          <div className="text-3xl">{item.emoji}</div>
          {isAuction && item.auction_end_time && (
            <div className="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-sm rounded-md px-1 py-0.5">
              <div className="flex items-center justify-center gap-0.5 text-[10px] text-white">
                <Clock className="w-2.5 h-2.5" />
                {getTimeRemaining(item.auction_end_time)}
              </div>
            </div>
          )}
        </div>

        {/* Content (Reduced padding and text size) */}
        <div className="p-1.5 space-y-1">
          <div>
            <h3 className="font-bold text-xs line-clamp-1">{item.name}</h3>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
          </div>

          {isAuction ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Current Bid</span>
                <span className="font-bold text-purple-500 text-xs">
                  {item.current_bid || item.starting_bid} XP
                </span>
              </div>
              {bidCount > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Users className="w-2.5 h-2.5" />
                  {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                </div>
              )}
              {/* Smallest button size: h-6, text-[10px] */}
              <Button
                onClick={() => openBidDialog(item)}
                disabled={owned}
                className="w-full h-6 text-[10px]"
                variant={owned ? 'outline' : 'default'}
              >
                {owned ? 'Owned' : 'Place Bid'}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Price */}
              <div className="flex items-center justify-between">
                {isFeatured ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-primary text-xs">
                      {discountedPrice} XP
                    </span>
                    <span className="text-[10px] text-muted-foreground line-through">
                      {item.xp_cost} XP
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-primary text-xs">
                    {item.xp_cost} XP
                  </span>
                )}
              </div>

              {/* Featured countdown */}
              {isFeatured && item.featured_end_date && (
                <div className="flex items-center gap-0.5 text-[10px] text-yellow-600 dark:text-yellow-400">
                  <Clock className="w-2.5 h-2.5" />
                  {getTimeRemaining(item.featured_end_date)}
                </div>
              )}

              {/* Purchase button */}
              <Button
                onClick={() => handlePurchase(item.id, item.name)}
                disabled={owned || !canAfford || purchasing === item.id}
                variant={owned ? 'outline' : 'default'}
                className="w-full h-6 text-[10px]"
              >
                {purchasing === item.id ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : owned ? (
                  'Owned'
                ) : !canAfford ? (
                  'Need XP'
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

    // Use responsive grid for categories to fit small cards better on mobile
    const isGridSection = title !== 'Live Auctions' && title !== 'Limited Edition';

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
          <Badge variant="outline" className="ml-auto">{items.length} items</Badge>
        </div>
        <div className={`${gradient ? `bg-gradient-to-r ${gradient} p-3 rounded-xl` : ''}`}>
          {isGridSection ? (
            // Tighter Responsive Grid (3 columns on mobile)
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {items.map(item => renderCompactCard(item))}
            </div>
          ) : (
            // Horizontal Scroll for Featured/Auction
            <div className="overflow-x-auto pb-3 -mx-4 px-4">
              <div className="flex gap-3">
                {items.map(item => renderCompactCard(item))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMarketplaceCard = (listing: MarketplaceListing) => {
    const itemData = listing.shop_items;
    const sellerData = listing.profiles;
    const owned = isOwned(listing.shop_item_id);
    const canAfford = userXP >= listing.asking_price;

    if (!itemData) return null;

    return (
      <Card 
        key={listing.id}
        // Small width on mobile, rounded-xl for rich design
        className="relative overflow-hidden w-full sm:w-36 flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"
      >
        <Badge className="absolute top-1 left-1 z-10 gap-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] px-1 py-0.5">
          <Users className="w-2.5 h-2.5" /> Resale
        </Badge>

        {owned && (
          <Badge variant="secondary" className="absolute top-1 right-1 z-10 gap-0.5 text-[10px] px-1 py-0.5">
            <Check className="w-2.5 h-2.5" /> Owned
          </Badge>
        )}

        {/* Reduced height and emoji size */}
        <div className="h-20 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="text-3xl">{itemData.emoji}</div>
        </div>

        {/* Reduced padding and text size */}
        <div className="p-1.5 space-y-1">
          <div>
            <h3 className="font-bold text-xs line-clamp-1">{itemData.name}</h3>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{itemData.description}</p>
          </div>

          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Users className="w-2.5 h-2.5" />
            @{sellerData?.handle || 'Unknown'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-500 text-xs">
                {listing.asking_price} XP
              </span>
            </div>

            {/* Smallest button size: h-6, text-[10px] */}
            <Button
              onClick={() => handlePurchaseMarketplaceItem(listing.id, itemData.name)}
              disabled={owned || !canAfford || purchasing === listing.id}
              variant={owned ? 'outline' : 'default'}
              className="w-full h-6 text-[10px]"
            >
              {purchasing === listing.id ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : owned ? (
                'Owned'
              ) : !canAfford ? (
                'Need XP'
              ) : (
                'Buy Now'
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderUserInventory = () => {
    const ownedItems = purchases
      .map(purchase => {
        const item = [...items, ...auctionItems, ...featuredItems].find(i => i.id === purchase.shop_item_id);
        return item ? { ...purchase, item } : null;
      })
      .filter(Boolean) as Array<UserPurchase & { item: ShopItem }>;

    if (ownedItems.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>You don't own any items yet</p>
        </div>
      );
    }

    return (
      // Inventory items remain horizontally scrollable
      <div className="overflow-x-auto pb-3 -mx-4 px-4">
        <div className="flex gap-3">
          {ownedItems.map((ownedItem) => (
            <Card 
              key={ownedItem.id}
              className="relative overflow-hidden w-full sm:w-36 flex-shrink-0 rounded-xl"
            >
              {/* Reduced height and emoji size */}
              <div className="h-20 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="text-3xl">{ownedItem.item.emoji}</div>
              </div>

              {/* Reduced padding and text size */}
              <div className="p-1.5 space-y-1">
                <div>
                  <h3 className="font-bold text-xs line-clamp-1">{ownedItem.item.name}</h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{ownedItem.item.description}</p>
                </div>

                {/* Smallest button size: h-6, text-[10px] */}
                <Button
                  onClick={() => openListDialog(ownedItem, ownedItem.item)}
                  variant="outline"
                  className="w-full h-6 text-[10px]"
                >
                  List on Marketplace
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // --- Main Component Render ---

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 rounded-xl">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>Please sign in to access the shop</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </DialogFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-7 h-7" />
                Shop & Marketplace
            </h1>
          <Badge variant="outline" className="gap-2 py-2 px-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold">{userXP} XP</span>
          </Badge>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === 'shop' ? 'default' : 'outline'}
            onClick={() => setActiveTab('shop')}
            className="flex-1"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Shop
          </Button>
          <Button
            variant={activeTab === 'marketplace' ? 'default' : 'outline'}
            onClick={() => setActiveTab('marketplace')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Marketplace
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : activeTab === 'shop' ? (
          <div className="space-y-8">
            {/* Live Auctions */}
            {renderSection(
              'Live Auctions',
              <Hammer className="w-6 h-6 text-purple-500" />,
              auctionItems,
              'from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl'
            )}

            {/* Featured Items */}
            {renderSection(
              'Limited Edition',
              <Zap className="w-6 h-6 text-yellow-500" />,
              featuredItems,
              'from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 rounded-xl'
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
        ) : (
          <div className="space-y-8">
            {/* My Inventory */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-6 h-6" />
                <h2 className="text-2xl font-bold">My Inventory</h2>
              </div>
              {renderUserInventory()}
            </div>

            {/* Marketplace Listings */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-bold">Community Marketplace</h2>
                <Badge variant="outline" className="ml-auto">
                  {marketplaceListings.length} listings
                </Badge>
              </div>
              {marketplaceListings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No marketplace listings available</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                  {/* Tighter Responsive Grid */}
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                    {marketplaceListings.map(listing => renderMarketplaceCard(listing))}
                  </div>
                </div>
              )}
            </div>
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

        {/* List Item Dialog */}
        <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>List Item on Marketplace</DialogTitle>
              <DialogDescription>
                {selectedItem && (
                  <>
                    Listing <strong>{selectedItem.name}</strong> for resale
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asking Price (XP)</label>
                <Input
                  type="number"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="Enter your asking price"
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  Set a fair price for other users to purchase your item
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setListDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateListing} disabled={placingBid || !listingPrice}>
                {placingBid ? <Loader2 className="w-4 h-4 animate-spin" /> : 'List Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
