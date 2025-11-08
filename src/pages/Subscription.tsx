import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const TIERS = {
  premium: {
    name: 'Premium',
    price: '$5.99',
    priceId: 'price_1SRJ5E6lTPKAzUvARwkNTsZy',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Unlimited AI chat messages',
      'Access to rare gifts',
      'Priority support',
      'Ad-free experience',
      'Custom avatar accessories',
    ],
  },
  vip: {
    name: 'VIP',
    price: '$19.99',
    priceId: 'price_1SRJ5Q6lTPKAzUvAF2iohAxa',
    icon: Crown,
    color: 'from-yellow-500 to-orange-500',
    features: [
      'Everything in Premium',
      'Exclusive VIP badge',
      'Special profile customization',
      'Early access to new features',
      'VIP-only gifts',
      'Dedicated support line',
    ],
  },
};

export default function Subscription() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { tier, loading: subLoading, subscriptionEnd, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    if (!user || !session) {
      navigate('/auth');
      return;
    }

    setLoadingCheckout(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        // Refresh subscription status after a delay
        setTimeout(refreshSubscription, 3000);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCheckout(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) return;

    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg">
            Unlock premium features and take your experience to the next level
          </p>
        </div>

        {/* Current Subscription Status */}
        {!subLoading && tier !== 'basic' && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="mb-2" variant={tier === 'vip' ? 'default' : 'secondary'}>
                    {tier === 'premium' ? 'Premium' : 'VIP'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionEnd && `Renews on ${new Date(subscriptionEnd).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                  variant="outline"
                >
                  {loadingPortal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Manage Subscription'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free Tier */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className={tier === 'basic' ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Basic</CardTitle>
                {tier === 'basic' && <Badge>Current Plan</Badge>}
              </div>
              <CardDescription className="text-2xl font-bold">Free</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                <span className="text-sm">Limited AI chat (10 messages/day)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                <span className="text-sm">Send common gifts</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                <span className="text-sm">Basic avatar customization</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-muted-foreground mt-0.5" />
                <span className="text-sm">Community features</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Premium and VIP Tiers */}
          {Object.entries(TIERS).map(([key, tierInfo]) => {
            const Icon = tierInfo.icon;
            const isCurrentTier = tier === key;
            return (
              <Card
                key={key}
                className={`relative overflow-hidden ${isCurrentTier ? 'border-primary' : ''}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tierInfo.color} opacity-5`} />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {tierInfo.name}
                    </CardTitle>
                    {isCurrentTier && <Badge>Current Plan</Badge>}
                  </div>
                  <CardDescription className="text-2xl font-bold">
                    {tierInfo.price}<span className="text-sm font-normal">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  {tierInfo.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="relative">
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(tierInfo.priceId)}
                    disabled={loadingCheckout === tierInfo.priceId || isCurrentTier}
                    variant={isCurrentTier ? 'outline' : 'default'}
                  >
                    {loadingCheckout === tierInfo.priceId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentTier ? (
                      'Current Plan'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All subscriptions auto-renew monthly. Cancel anytime from your subscription settings.</p>
        </div>
      </div>
    </div>
  );
}
