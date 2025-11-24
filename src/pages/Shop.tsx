import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Store } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ListGiftDialog } from '@/components/marketplace/ListGiftDialog';
import { GiftMarketplaceCard } from '@/components/marketplace/GiftMarketplaceCard';

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

export default function Shop() {
  const { user } = useAuth();
  const [listings, setListings] = useState<GiftMarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [listDialogOpen, setListDialogOpen] = useState(false);

  useEffect(() => {
    fetchMarketplaceListings();
  }, []);

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
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings((data || []) as any);
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

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
        title="Gift Shop - Buy & Sell Rare Gifts"
        description="Buy and sell rare, epic, and legendary gifts on the marketplace"
      />

      <div className="min-h-screen bg-background pb-20 lg:pb-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Gift Shop</h1>
                  <p className="text-sm text-muted-foreground">Buy & sell rare collectibles</p>
                </div>
              </div>
              {user && (
                <Button onClick={() => setListDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  List Gift
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
              <p className="text-muted-foreground mb-6">Be the first to list a rare gift!</p>
              {user && (
                <Button onClick={() => setListDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Gift
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <GiftMarketplaceCard
                  key={listing.id}
                  listing={listing}
                  onPurchaseComplete={fetchMarketplaceListings}
                />
              ))}
            </div>
          )}
        </div>

        {/* List Gift Dialog */}
        <ListGiftDialog 
          open={listDialogOpen}
          onOpenChange={setListDialogOpen}
          onListingCreated={fetchMarketplaceListings}
        />
      </div>
    </>
  );
}
