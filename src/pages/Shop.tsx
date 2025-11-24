import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Store } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <SEO 
        title="Gift Marketplace - Buy & Sell Rare Gifts"
        description="Buy and sell rare, epic, and legendary gifts on the marketplace"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
              <Store className="relative w-24 h-24 text-primary" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold">Gift Marketplace</h1>
              <p className="text-xl text-muted-foreground max-w-md">
                Trade rare, epic, and legendary gifts with other users
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => navigate('/marketplace')}
              className="gap-2"
            >
              <Store className="w-5 h-5" />
              Visit Marketplace
            </Button>

            {!user && (
              <p className="text-sm text-muted-foreground">
                Sign in to start trading gifts
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
