import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Store, Package } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface GiftMarketplaceListing {
  id: string;
  asking_price: number;
  created_at: string;
  user_id: string;
  seller: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
  gift: {
    id: string;
    name: string;
    emoji: string;
    rarity: string;
    description: string | null;
  };
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

const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<GiftMarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<GiftMarketplaceListing | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    fetchMarketplaceListings();
    if (user) {
      fetchUserXP();
    }
  }, [user]);

  const fetchUserXP = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .single();
    if (data) setUserXP(data.xp);
  };

  const fetchMarketplaceListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          id,
          asking_price,
          created_at,
          user_id,
          seller:profiles!marketplace_listings_user_id_fkey (
            display_name,
            handle,
            avatar_url
          ),
          gift:gifts (
            id,
            name,
            emoji,
            rarity,
            description,
            base_xp_cost
          )
        `)
        .eq('is_active', true)
        .not('gift_id', 'is', null);

      if (error) throw error;

      // Fetch gift statistics for last sale prices
      const { data: statsData } = await supabase
        .from('gift_statistics')
        .select('gift_id, last_sale_price');

      // Update asking_price to use last_sale_price where applicable
      const listingsWithUpdatedPrices = (data || []).map((listing: any) => {
        const stats = statsData?.find((s: any) => s.gift_id === listing.gift.id);
        return {
          ...listing,
          // Use last_sale_price if available, otherwise use asking_price
          asking_price: stats?.last_sale_price || listing.gift.base_xp_cost || listing.asking_price
        };
      }).sort((a: any, b: any) => a.asking_price - b.asking_price);

      setListings(listingsWithUpdatedPrices as any);
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedListing || !user) {
      toast.error('Please sign in to purchase');
      return;
    }

    if (userXP < selectedListing.asking_price) {
      toast.error('Insufficient Nexa balance');
      return;
    }

    setPurchasing(true);
    try {
      // Use database function to handle purchase atomically
      const { data, error } = await supabase.rpc('purchase_marketplace_gift', {
        p_listing_id: selectedListing.id,
        p_buyer_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        toast.error(result.error || 'Failed to purchase gift');
        return;
      }

      toast.success(`You purchased ${selectedListing.gift.name}! Check your profile gifts.`);
      setSelectedListing(null);
      fetchMarketplaceListings();
      fetchUserXP();
    } catch (error) {
      console.error('Error purchasing gift:', error);
      toast.error('Failed to purchase gift');
    } finally {
      setPurchasing(false);
    }
  };

  const groupedListings = listings.reduce((acc, listing) => {
    const rarity = listing.gift.rarity.toLowerCase();
    if (!acc[rarity]) {
      acc[rarity] = [];
    }
    acc[rarity].push(listing);
    return acc;
  }, {} as Record<string, GiftMarketplaceListing[]>);

  const isOwnListing = selectedListing && user?.id === selectedListing.user_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Gift Shop - Buy Rare Gifts"
        description="Browse and purchase rare, epic, and legendary gifts"
      />

      <div className="min-h-screen pb-20 lg:pb-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Gift Shop</h1>
              </div>
              {user && (
                <Button size="sm" onClick={() => navigate('/marketplace')}>
                  <Package className="h-4 w-4 mr-2" />
                  My Listings
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-bold mb-2">No gifts available</h2>
              <p className="text-muted-foreground">Check back later for new listings</p>
            </div>
          ) : (
            <div className="space-y-8">
              {rarityOrder.map((rarity) => {
                const rarityListings = groupedListings[rarity];
                if (!rarityListings || rarityListings.length === 0) return null;

                return (
                  <div key={rarity}>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={getRarityColor(rarity)} variant="outline">
                        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {rarityListings.length} {rarityListings.length === 1 ? 'gift' : 'gifts'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
                      {rarityListings.map((listing) => (
                        <motion.button
                          key={listing.id}
                          onClick={() => setSelectedListing(listing)}
                          className="flex flex-col items-center gap-2 transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl">
                            {listing.gift.emoji}
                          </div>
                          <p className="text-xs font-medium text-center line-clamp-1 w-full">
                            {listing.gift.name}
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {listing.asking_price.toLocaleString()} Nexa
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Purchase Sheet */}
      <Sheet open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto bg-gradient-to-b from-background to-muted/20">
          {selectedListing && (
            <>
              <SheetHeader className="space-y-2 pb-4 border-b border-border/40">
                <SheetTitle className="text-xl font-bold">
                  Gift Details
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  Complete information about this exclusive gift
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-4 pb-6">
                {/* Gift Display with Animation */}
                <motion.div 
                  className="flex flex-col items-center text-center space-y-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <motion.div 
                      className="text-[80px] p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {selectedListing.gift.emoji}
                    </motion.div>
                    <div className="absolute -bottom-1 -right-1">
                      <Badge className={`${getRarityColor(selectedListing.gift.rarity)} px-3 py-1 text-xs font-semibold shadow-lg`}>
                        {selectedListing.gift.rarity}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mt-2">
                    {selectedListing.gift.name}
                  </h3>
                  {selectedListing.gift.description && (
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed px-4">
                      {selectedListing.gift.description}
                    </p>
                  )}
                </motion.div>

                {/* Price Card */}
                <motion.div 
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
                  <div className="relative text-center py-4 px-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Asking Price
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <p className="text-4xl font-bold text-primary tracking-tight">
                        {selectedListing.asking_price.toLocaleString()}
                      </p>
                      <span className="text-lg font-semibold text-muted-foreground">
                        Nexa
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Seller Info Card */}
                <motion.div 
                  className="rounded-xl bg-card/50 border border-border/50 p-4 shadow-md backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                        <AvatarImage src={selectedListing.seller.avatar_url || undefined} />
                        <AvatarFallback className="text-base font-bold">
                          {selectedListing.seller.display_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Seller
                        </p>
                        <p className="text-base font-semibold">
                          {selectedListing.seller.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{selectedListing.seller.handle}
                        </p>
                      </div>
                    </div>
                    <User className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                </motion.div>

                {/* Your Balance */}
                {user && (
                  <motion.div 
                    className="rounded-xl bg-muted/30 border border-border/30 p-4 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Your Balance
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold">
                            {userXP.toLocaleString()}
                          </p>
                          <span className="text-base font-semibold text-muted-foreground">
                            Nexa
                          </span>
                        </div>
                      </div>
                      {userXP < selectedListing.asking_price && (
                        <Badge variant="destructive" className="text-xs">
                          Insufficient Balance
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Purchase Button */}
                {!isOwnListing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      onClick={handlePurchase}
                      disabled={purchasing || !user || userXP < selectedListing.asking_price}
                      className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing Purchase...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Complete Purchase
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {isOwnListing && (
                  <Badge variant="secondary" className="w-full justify-center py-3 text-sm font-semibold">
                    This is your listing
                  </Badge>
                )}

                {!user && (
                  <Button variant="outline" className="w-full h-12 font-semibold text-base" disabled>
                    Sign in to purchase
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
