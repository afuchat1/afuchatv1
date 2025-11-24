import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { Check, Crown, Sparkles, Zap, Shield, Star } from 'lucide-react';
import { toast } from 'sonner';

const TIERS = {
  premium: {
    price_id: "price_1SRJ5E6lTPKAzUvARwkNTsZy",
    product_id: "prod_TO5FgJrgCvSYuD",
    name: "Premium",
    price: "$5.99/month",
    features: [
      "Unlimited AI Chat",
      "Rare Gifts Access",
      "Priority Support",
      "Custom Profile Theme",
      "Early Feature Access"
    ]
  },
  vip: {
    price_id: "price_1SRJ5Q6lTPKAzUvAF2iohAxa",
    product_id: "prod_TO5Ff17rDukZRi",
    name: "VIP",
    price: "$19.99/month",
    features: [
      "Everything in Premium",
      "Exclusive VIP Badge",
      "Priority Support 24/7",
      "Exclusive Content Access",
      "VIP-Only Events",
      "Custom Profile Badge",
      "Unlimited Gift Sending"
    ]
  }
};

export default function PremiumSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{ subscribed: boolean; product_id: string | null; subscription_end: string | null }>({
    subscribed: false,
    product_id: null,
    subscription_end: null
  });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    checkSubscription();

    // Handle success/cancel redirects
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! Checking status...');
      setTimeout(() => checkSubscription(), 2000);
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Subscription canceled');
    }
  }, [user, navigate, searchParams]);

  const checkSubscription = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to check subscription status');
    } finally {
      setChecking(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth/signin');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanName = () => {
    if (!subscription.subscribed || !subscription.product_id) return null;
    return Object.values(TIERS).find(tier => tier.product_id === subscription.product_id)?.name;
  };

  return (
    <>
      <SEO 
        title="Premium Subscription - AfuChat"
        description="Unlock exclusive features with AfuChat Premium. Get unlimited AI chat, rare gifts access, and more."
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
              <Crown className="h-10 w-10 text-primary" />
              Go Premium
            </h1>
            <p className="text-muted-foreground text-lg">
              Unlock exclusive features and take your experience to the next level
            </p>
          </div>

          {/* Current Subscription Status */}
          {checking ? (
            <div className="flex justify-center mb-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : subscription.subscribed && (
            <Card className="mb-12 p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    Current Plan: {getCurrentPlanName()}
                  </h3>
                  <p className="text-muted-foreground">
                    Active until {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  variant="outline"
                  className="rounded-xl"
                >
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </Button>
              </div>
            </Card>
          )}

          {/* Pricing Tiers */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Premium Tier */}
            <Card className={`p-8 relative ${subscription.product_id === TIERS.premium.product_id ? 'ring-2 ring-primary' : ''}`}>
              {subscription.product_id === TIERS.premium.product_id && (
                <Badge className="absolute top-4 right-4 bg-primary">Current Plan</Badge>
              )}
              <div className="text-center mb-6">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2">{TIERS.premium.name}</h3>
                <div className="text-3xl font-bold mb-2">{TIERS.premium.price}</div>
                <p className="text-muted-foreground">Perfect for regular users</p>
              </div>

              <ul className="space-y-3 mb-8">
                {TIERS.premium.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(TIERS.premium.price_id)}
                disabled={loading || subscription.product_id === TIERS.premium.product_id}
                className="w-full h-12 font-semibold rounded-xl"
                size="lg"
              >
                {loading ? 'Processing...' : subscription.product_id === TIERS.premium.product_id ? 'Current Plan' : 'Subscribe'}
              </Button>
            </Card>

            {/* VIP Tier */}
            <Card className={`p-8 relative bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30 ${subscription.product_id === TIERS.vip.product_id ? 'ring-2 ring-primary' : ''}`}>
              {subscription.product_id === TIERS.vip.product_id && (
                <Badge className="absolute top-4 right-4 bg-primary">Current Plan</Badge>
              )}
              <Badge className="absolute top-4 left-4 bg-primary">Most Popular</Badge>
              <div className="text-center mb-6 mt-6">
                <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2">{TIERS.vip.name}</h3>
                <div className="text-3xl font-bold mb-2">{TIERS.vip.price}</div>
                <p className="text-muted-foreground">For power users</p>
              </div>

              <ul className="space-y-3 mb-8">
                {TIERS.vip.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(TIERS.vip.price_id)}
                disabled={loading || subscription.product_id === TIERS.vip.product_id}
                className="w-full h-12 font-semibold rounded-xl bg-primary hover:bg-primary/90"
                size="lg"
              >
                {loading ? 'Processing...' : subscription.product_id === TIERS.vip.product_id ? 'Current Plan' : 'Subscribe'}
              </Button>
            </Card>
          </div>

          {/* Premium Benefits */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Why Go Premium?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Unlimited Access</h3>
                <p className="text-muted-foreground">
                  Unlock unlimited AI conversations and rare gift sending
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Priority Support</h3>
                <p className="text-muted-foreground">
                  Get help faster with premium customer support
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Exclusive Features</h3>
                <p className="text-muted-foreground">
                  Access features before everyone else
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
