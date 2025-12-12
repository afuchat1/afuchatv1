import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ListGiftDialog } from '@/components/marketplace/ListGiftDialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PremiumGate } from '@/components/PremiumGate';
import { PageHeader } from '@/components/PageHeader';

interface MyListing {
  id: string;
  asking_price: number;
  created_at: string;
  gift: {
    id: string;
    name: string;
    emoji: string;
    rarity: string;
    base_xp_cost: number;
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

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          id,
          asking_price,
          created_at,
          gift:gifts (
            id,
            name,
            emoji,
            rarity,
            base_xp_cost
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings((data || []) as any);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setDeleting(listingId);
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ is_active: false })
        .eq('id', listingId);

      if (error) throw error;

      toast.success('Listing removed');
      fetchMyListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to remove listing');
    } finally {
      setDeleting(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to access marketplace</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader />
      </div>
    );
  }

  return (
    <PremiumGate feature="Gift Marketplace" showUpgrade={true} requiredTier="platinum">
      <SEO 
        title="My Marketplace Listings"
        description="Manage your gift marketplace listings"
      />

      <div className="min-h-screen bg-background pb-24 lg:pb-4">
        <PageHeader 
          title="My Listings" 
          subtitle="Manage your marketplace gifts"
          icon={<Package className="h-5 w-5 text-primary" />}
          rightContent={
            <Button onClick={() => setListDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              List Gift
            </Button>
          }
        />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-6">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-bold mb-2">No active listings</h2>
              <p className="text-muted-foreground mb-6">Start by listing a rare gift for sale</p>
              <Button onClick={() => setListDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                List Your First Gift
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} className="p-6">
                  <div className="space-y-4">
                    {/* Gift Display */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="text-6xl p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-full">
                        {listing.gift.emoji}
                      </div>
                      <h3 className="text-xl font-bold">{listing.gift.name}</h3>
                      <Badge className={getRarityColor(listing.gift.rarity)}>
                        {listing.gift.rarity}
                      </Badge>
                    </div>

                    {/* Price */}
                    <div className="text-center py-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Listed Price</p>
                      <p className="text-3xl font-bold text-primary">
                        {listing.asking_price.toLocaleString()}
                        <span className="text-lg text-muted-foreground ml-2">Nexa</span>
                      </p>
                      {(() => {
                        const percentIncrease = ((listing.asking_price - listing.gift.base_xp_cost) / listing.gift.base_xp_cost * 100).toFixed(1);
                        return (
                          <>
                            <p className="text-sm font-semibold text-green-500 mt-1">
                              +{percentIncrease}% market increase
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Base price: {listing.gift.base_xp_cost.toLocaleString()} Nexa
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={deleting === listing.id}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Listing
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ListGiftDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onListingCreated={fetchMyListings}
      />
    </PremiumGate>
  );
}
