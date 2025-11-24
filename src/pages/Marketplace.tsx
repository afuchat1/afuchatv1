import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Store, Package } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ListGiftDialog } from '@/components/marketplace/ListGiftDialog';
import { useNavigate } from 'react-router-dom';

interface MyListing {
  id: string;
  asking_price: number;
  created_at: string;
  is_active: boolean;
  gift: {
    id: string;
    name: string;
    emoji: string;
    rarity: string;
    description: string | null;
  };
}

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [listDialogOpen, setListDialogOpen] = useState(false);

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
          is_active,
          gift:gifts (
            id,
            name,
            emoji,
            rarity,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings((data || []) as any);
    } catch (error) {
      console.error('Error fetching my listings:', error);
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ is_active: false })
        .eq('id', listingId);

      if (error) throw error;

      toast.success('Listing removed');
      fetchMyListings();
    } catch (error) {
      console.error('Error removing listing:', error);
      toast.error('Failed to remove listing');
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
        title="My Marketplace Listings"
        description="Manage your rare gift listings"
      />

      <div className="min-h-screen bg-background pb-20 lg:pb-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">My Listings</h1>
                  <p className="text-sm text-muted-foreground">Manage your marketplace</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/shop')}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Shop
                </Button>
                {user && (
                  <Button onClick={() => setListDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    List Gift
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Sign in to manage listings</h2>
              <p className="text-muted-foreground">Create an account to list your rare gifts</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-bold mb-2">No listings yet</h2>
              <p className="text-muted-foreground mb-6">Start selling your rare gifts!</p>
              <Button onClick={() => setListDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                List Your First Gift
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-card border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="text-4xl text-center">{listing.gift.emoji}</div>
                  <div className="text-center">
                    <h3 className="font-semibold">{listing.gift.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{listing.gift.rarity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{listing.asking_price} ACoin</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Listed {new Date(listing.created_at).toLocaleDateString()}</span>
                    <span className={listing.is_active ? "text-green-500" : "text-red-500"}>
                      {listing.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {listing.is_active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRemoveListing(listing.id)}
                    >
                      Remove Listing
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List Gift Dialog */}
        <ListGiftDialog 
          open={listDialogOpen}
          onOpenChange={setListDialogOpen}
          onListingCreated={fetchMyListings}
        />
      </div>
    </>
  );
}
