import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Crown, Check, Coins, Calendar, Sparkles, ArrowLeft, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  acoin_price: number;
  duration_days: number;
  features: string[];
  grants_verification: boolean;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  expires_at: string;
  is_active: boolean;
  acoin_paid: number;
}

export default function Premium() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [acoinBalance, setAcoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchUserData();
    }
  }, [user]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('acoin_price', { ascending: true });

    if (!error && data) {
      const parsedPlans = data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string)
      }));
      setPlans(parsedPlans as SubscriptionPlan[]);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;

    // Fetch ACoin balance
    const { data: profileData } = await supabase
      .from('profiles')
      .select('acoin')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setAcoinBalance(profileData.acoin || 0);
    }

    // Fetch active subscription
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subData) {
      setCurrentSubscription(subData);
    }

    setLoading(false);
  };

  const handlePurchase = async (planId: string, price: number) => {
    if (!user) {
      toast.error('Please sign in to purchase a subscription');
      return;
    }

    if (acoinBalance < price) {
      toast.error(`Insufficient ACoin! You need ${price} ACoin but have ${acoinBalance}`);
      navigate('/wallet');
      return;
    }

    setPurchasing(planId);

    try {
      const { data, error } = await supabase.rpc('purchase_subscription', {
        p_plan_id: planId
      });

      if (error) throw error;

      const result = data as any;

      if (result.success) {
        toast.success(result.message);
        await fetchUserData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase subscription');
    } finally {
      setPurchasing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Premium Subscription
            </h1>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* ACoin Balance Card */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-full">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your ACoin Balance</p>
                <p className="text-3xl font-bold">{acoinBalance.toLocaleString()}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/wallet')}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Get More ACoin
            </Button>
          </div>
        </Card>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card className="p-6 mb-8 border-primary bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary">Active Premium</Badge>
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    Subscription ends: <span className="font-semibold text-foreground">{formatDate(currentSubscription.expires_at)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your verified badge and premium features will expire on this date
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            Unlock premium features and get verified with ACoin
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isPopular = index === 1; // Middle plan
            const canAfford = acoinBalance >= plan.acoin_price;

            return (
              <Card
                key={plan.id}
                className={`p-6 relative ${
                  isPopular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="text-4xl font-bold">{plan.acoin_price}</span>
                    <span className="text-muted-foreground">ACoin</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {plan.duration_days} days
                  </p>
                </div>

                <Separator className="my-6" />

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(plan.id, plan.acoin_price)}
                  disabled={!canAfford || purchasing === plan.id}
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                >
                  {purchasing === plan.id ? (
                    'Processing...'
                  ) : !canAfford ? (
                    'Insufficient ACoin'
                  ) : (
                    `Subscribe Now`
                  )}
                </Button>

                {!canAfford && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Need {plan.acoin_price - acoinBalance} more ACoin
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="p-6 mt-8 bg-muted/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Premium Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Verified Badge</p>
                  <p className="text-sm text-muted-foreground">Get the coveted verified checkmark</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Gift Marketplace</p>
                  <p className="text-sm text-muted-foreground">Buy and sell rare gifts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Stories & Moments</p>
                  <p className="text-sm text-muted-foreground">Share 24-hour stories with followers</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Red Envelopes</p>
                  <p className="text-sm text-muted-foreground">Send Nexa gifts to multiple friends</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">AI Chat Assistant</p>
                  <p className="text-sm text-muted-foreground">Chat with AfuAI for help and insights</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Premium Badge</p>
                  <p className="text-sm text-muted-foreground">Show your premium status on your profile</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 mt-6 bg-muted/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            How It Works
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">1.</span>
              <span>Convert your Nexa to ACoin in the Wallet section</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">2.</span>
              <span>Choose a premium plan that suits your needs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">3.</span>
              <span>Pay with ACoin and instantly get verified status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">4.</span>
              <span>Enjoy premium features throughout your subscription period</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}