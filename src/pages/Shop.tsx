import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Check, Sparkles, Zap, Clock, Hammer, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  item_type: 'accessory' | 'theme' | 'effect' | 'badge';
  xp_cost: number;
  emoji: string;
  image_url?: string;
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
    image_url?: string;
  };
  profiles?: {
    display_name: string;
    handle: string;
  };
}

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

  useEffect(() => {
    fetchShopData();
  }, [user]);

  // Real-time subscription for bids
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
          
          // Update bids state
          setBids(prev => ({
            ...prev,
            [newBid.shop_item_id]: [newBid, ...(prev[newBid.shop_item_id] || [])]
          }));

          // Update the current bid on auction items
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

      // Fetch marketplace listings
      const { data: marketplaceData, error: marketplaceError } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          shop_items (name, description, emoji, item_type, image_url),
          profiles (display_name, handle)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (marketplaceError) throw marketplaceError;

      setMarketplaceListings((marketplaceData || []) as MarketplaceListing[]);

      // Fetch user purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('user_shop_purchases')
        .select('id, shop_item_id')
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

      if (!data || data.length === 0) {
        throw new Error('No response from server');
      }

      const result = data[0] as { success: boolean; message: string; new_xp?: number };

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

      if (!data || data.length === 0) {
        throw new Error('No response from server');
      }

      const result = data[0] as { success: boolean; message: string };

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

  const openListDialog = (purchase: UserPurchase, item: ShopItem) => {
    setSelectedPurchase(purchase);
    setSelectedItem(item);
    setListingPrice('');
    setListDialogOpen(true);
  };

  const handleCreateListing = async () => {
    if (!selectedPurchase || !listingPrice) return;

    setPlacingBid(true);
    try {
      const price = parseInt(listingPrice);
      const { data, error } = await supabase.rpc('create_marketplace_listing', {
        p_purchase_id: selectedPurchase.id,
        p_asking_price: price,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No response from server');
      }

      const result = data[0] as { success: boolean; message: string };

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
      toast.error('Failed to create listing');
    } finally {
      setPlacingBid(false);
    }
  };

  const handlePurchaseMarketplaceItem = async (listingId: string, itemName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setPurchasing(listingId);
    try {
      const { data, error } = await supabase.rpc('purchase_marketplace_item', {
        p_listing_id: listingId,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No response from server');
      }

      const result = data[0] as { success: boolean; message: string; new_xp?: number };

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

  const getItemImage = (item: ShopItem) => {
    if (item.image_url) return item.image_url;
    
    // Default placeholder images based on item type
    const placeholders = {
      'accessory': 'https://images.unsplash.com/photo-1618004912476-29818d81ae2e?w=400&h=300&fit=crop',
      'theme': 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop',
      'effect': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop',
      'badge': 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=300&fit=crop'
    };
    
    return placeholders[item.item_type] || placeholders.badge;
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
        className={`relative overflow-hidden w-48 flex-shrink-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl ${
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
              <Hammer className="w-3 w-3" />
              Auction
            </Badge>
          )}
        </div>

        {/* Product Image */}
        <div className="h-32 relative overflow-hidden">
          <img 
            src={getItemImage(item)} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {isAuction && item.auction_end_time && (
            <div className="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <div className="flex items-center justify-center gap-1 text-xs text-white">
                <Clock className="w-2.5 h-2.5" />
                {getTimeRemaining(item.auction_end_time)}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 space-y-1.5">
          <div>
            <h3 className="font-bold text-xs line-clamp-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          </div>

          {isAuction ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Current Bid:</span>
                <span className="font-bold text-purple-600">
                  {item.current_bid || item.starting_bid || 0} XP
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
                size="sm"
                className="w-full h-7 text-xs"
                variant={owned ? "secondary" : "default"}
              >
                {owned ? 'Already Owned' : 'Place Bid'}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                {isFeatured && item.discount_percentage ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground line-through">
                      {item.xp_cost} XP
                    </span>
                    <span className="text-sm font-bold text-yellow-600">
                      {discountedPrice} XP
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold">{item.xp_cost} XP</span>
                )}
              </div>
              <Button
                onClick={() => handlePurchase(item.id, item.name)}
                disabled={owned || !canAfford || purchasing === item.id}
                size="sm"
                className="w-full h-7 text-xs"
                variant={owned ? "secondary" : canAfford ? "default" : "outline"}
              >
                {purchasing === item.id ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Purchasing...
                  </>
                ) : owned ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Owned
                  </>
                ) : !canAfford ? (
                  'Not Enough XP'
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Shop</h1>
            <p className="text-muted-foreground">Upload your own images via Supabase Storage</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{userXP.toLocaleString()} XP</span>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === 'shop' ? 'default' : 'outline'}
            onClick={() => setActiveTab('shop')}
          >
            Shop
          </Button>
          <Button
            variant={activeTab === 'marketplace' ? 'default' : 'outline'}
            onClick={() => setActiveTab('marketplace')}
          >
            Marketplace
          </Button>
        </div>

        {activeTab === 'shop' ? (
          <div className="space-y-8">
            {auctionItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Hammer className="w-5 h-5 text-purple-500" />
                  <h2 className="text-2xl font-bold">Live Auctions</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {auctionItems.map(item => renderCompactCard(item))}
                </div>
              </div>
            )}

            {featuredItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-2xl font-bold">Featured Deals</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {featuredItems.map(item => renderCompactCard(item))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold mb-4">All Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map(item => renderCompactCard(item))}
              </div>
            </div>

            {purchases.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Your Items</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {purchases.map(purchase => {
                    const item = items.find(i => i.id === purchase.shop_item_id);
                    if (!item) return null;
                    return (
                      <Card key={purchase.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="text-4xl">{item.emoji}</div>
                            <Badge variant="secondary">
                              <Check className="w-3 h-3 mr-1" />
                              Owned
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription className="text-sm">{item.description}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button
                            onClick={() => openListDialog(purchase, item)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            List on Marketplace
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">Marketplace</h2>
            {marketplaceListings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No items listed on the marketplace yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {marketplaceListings.map(listing => (
                  <Card key={listing.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="text-4xl">{listing.shop_items?.emoji}</div>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          Resale
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{listing.shop_items?.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {listing.shop_items?.description}
                      </CardDescription>
                      <div className="text-xs text-muted-foreground">
                        Seller: @{listing.profiles?.handle}
                      </div>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-2">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-muted-foreground">Price:</span>
                        <span className="text-lg font-bold">{listing.asking_price} XP</span>
                      </div>
                      <Button
                        onClick={() => handlePurchaseMarketplaceItem(listing.id, listing.shop_items?.name || 'Item')}
                        disabled={listing.user_id === user?.id || userXP < listing.asking_price || purchasing === listing.id}
                        size="sm"
                        className="w-full"
                      >
                        {purchasing === listing.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Purchasing...
                          </>
                        ) : listing.user_id === user?.id ? (
                          'Your Listing'
                        ) : userXP < listing.asking_price ? (
                          'Not Enough XP'
                        ) : (
                          'Purchase'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bid</DialogTitle>
            <DialogDescription>
              Place your bid on {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Bid</label>
              <div className="text-2xl font-bold text-purple-600">
                {selectedItem?.current_bid || selectedItem?.starting_bid || 0} XP
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Your Bid</label>
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                min={(selectedItem?.current_bid || selectedItem?.starting_bid || 0) + (selectedItem?.min_bid_increment || 10)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum bid: {(selectedItem?.current_bid || selectedItem?.starting_bid || 0) + (selectedItem?.min_bid_increment || 10)} XP
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Your XP:</span>
              <span className="font-bold">{userXP} XP</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlaceBid} disabled={placingBid || !bidAmount}>
              {placingBid ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing Bid...
                </>
              ) : (
                'Place Bid'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List on Marketplace</DialogTitle>
            <DialogDescription>
              Set a price for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asking Price (XP)</label>
              <Input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="Enter asking price"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateListing} disabled={placingBid || !listingPrice}>
              {placingBid ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Listing...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
