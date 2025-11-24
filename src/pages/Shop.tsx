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
            description
          )
        `)
        .eq('is_active', true)
        .not('gift_id', 'is', null)
        .order('asking_price', { ascending: true });

      if (error) throw error;

      setListings((data || []) as any);
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
      // Deduct Nexa from buyer
      const { error: buyerError } = await supabase
        .from('profiles')
        .update({ xp: userXP - selectedListing.asking_price })
        .eq('id', user.id);

      if (buyerError) throw buyerError;

      // Add Nexa to seller
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', selectedListing.user_id)
        .single();

      if (sellerData) {
        const { error: sellerError } = await supabase
          .from('profiles')
          .update({ xp: sellerData.xp + selectedListing.asking_price })
          .eq('id', selectedListing.user_id);

        if (sellerError) throw sellerError;
      }

      // Create gift transaction
      const { error: txError } = await supabase
        .from('gift_transactions')
        .insert({
          gift_id: selectedListing.gift.id,
          sender_id: selectedListing.user_id,
          receiver_id: user.id,
          xp_cost: selectedListing.asking_price,
        });

      if (txError) throw txError;

      // Mark listing as inactive
      const { error: listingError } = await supabase
        .from('marketplace_listings')
        .update({ is_active: false })
        .eq('id', selectedListing.id);

      if (listingError) throw listingError;

      // Update last sale price
      await supabase
        .from('gift_statistics')
        .upsert({
          gift_id: selectedListing.gift.id,
          last_sale_price: selectedListing.asking_price,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'gift_id'
        });

      toast.success(`You purchased ${selectedListing.gift.name}!`);
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
                            {listing.asking_price.toLocaleString()}
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
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          {selectedListing && (
            <>
              <SheetHeader>
                <SheetTitle>Purchase Gift</SheetTitle>
                <SheetDescription>
                  Review the details before purchasing
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Gift Display */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="text-8xl p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-full">
                    {selectedListing.gift.emoji}
                  </div>
                  <h3 className="text-2xl font-bold">{selectedListing.gift.name}</h3>
                  <Badge className={getRarityColor(selectedListing.gift.rarity)}>
                    {selectedListing.gift.rarity}
                  </Badge>
                  {selectedListing.gift.description && (
                    <p className="text-sm text-muted-foreground max-w-md">
                      {selectedListing.gift.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center py-6 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Price</p>
                  <p className="text-4xl font-bold text-primary">
                    {selectedListing.asking_price.toLocaleString()}
                    <span className="text-xl text-muted-foreground ml-2">Nexa</span>
                  </p>
                </div>

                {/* Seller Info */}
                <div className="flex items-center justify-center gap-3 py-4 border-y border-border">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Seller:</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedListing.seller.avatar_url || undefined} />
                      <AvatarFallback>{selectedListing.seller.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">@{selectedListing.seller.handle}</span>
                  </div>
                </div>

                {/* Your Balance */}
                {user && (
                  <div className="text-center py-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
                    <p className="text-xl font-bold">
                      {userXP.toLocaleString()} <span className="text-muted-foreground">Nexa</span>
                    </p>
                  </div>
                )}

                {/* Purchase Button */}
                {!isOwnListing && (
                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing || !user || userXP < selectedListing.asking_price}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Purchase Gift
                      </>
                    )}
                  </Button>
                )}

                {isOwnListing && (
                  <Badge variant="secondary" className="w-full justify-center py-3 text-base">
                    This is your listing
                  </Badge>
                )}

                {!user && (
                  <Button variant="outline" className="w-full h-12" disabled>
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
