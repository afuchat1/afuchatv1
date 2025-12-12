import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Crown, Check, Coins, Calendar, Sparkles, Gift, Users, Radio, 
  MessageSquare, Image, Ban, Eye, Palette, Shield, Star, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/PageHeader';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  acoin_price: number;
  duration_days: number;
  features: string[];
  grants_verification: boolean;
  tier: string;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  acoin_paid: number;
  subscription_plans?: {
    name: string;
    duration_days: number;
    tier?: string;
  };
}

// Tier-specific styling and icons
const tierConfig = {
  silver: {
    gradient: 'from-slate-400 to-slate-500',
    bgGradient: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900',
    borderColor: 'border-slate-400',
    textColor: 'text-slate-600 dark:text-slate-300',
    icon: Shield,
    label: 'Essentials'
  },
  gold: {
    gradient: 'from-yellow-400 to-amber-500',
    bgGradient: 'from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    icon: Star,
    label: 'Popular'
  },
  platinum: {
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/30',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-600 dark:text-violet-400',
    icon: Crown,
    label: 'Ultimate'
  }
};

// Feature icons mapping
const featureIcons: Record<string, typeof Shield> = {
  'Verified badge': Shield,
  'Ad-free experience': Ban,
  'Pin 1 gift on profile': Gift,
  'Pin 2 gifts on profile': Gift,
  'Pin 3 gifts on profile': Gift,
  '1 red envelope claim per day': Gift,
  '5 red envelope claims per day': Gift,
  'Unlimited red envelope claims': Zap,
  'Create red envelopes': MessageSquare,
  'Basic chat themes': Palette,
  'Custom chat themes': Palette,
  'AI Chat Themes & Wallpapers': Palette,
  'Create stories': Image,
  'Create groups': Users,
  'Create channels': Radio,
  'AI Post Analysis': Sparkles,
  'Gift Marketplace access': Gift,
  'Leaderboard privacy': Eye,
  'AfuAI Chat Assistant': MessageSquare,
  'Priority support': Star
};

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

    // Fetch active subscription with plan details
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          duration_days,
          tier
        )
      `)
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
    <div className="min-h-screen bg-background pb-20">
      <PageHeader 
        title="Premium" 
        icon={<Crown className="h-5 w-5 text-primary" />}
      />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* ACoin Balance Card */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="flex items-center justify-between flex-wrap gap-4">
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary">Active Premium</Badge>
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  </div>
                  <p className="text-sm font-semibold">
                    {currentSubscription.subscription_plans?.name || 'Premium Plan'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Started:</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(currentSubscription.started_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Expires:</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(currentSubscription.expires_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Duration:</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {currentSubscription.subscription_plans?.duration_days || 0} days
                  </span>
                </div>
              </div>

              <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Your verified badge and premium features will expire on {formatDate(currentSubscription.expires_at)}
                </p>
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

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:justify-center">
          {plans.map((plan) => {
            const tier = (plan.tier || 'silver') as keyof typeof tierConfig;
            const config = tierConfig[tier] || tierConfig.silver;
            const TierIcon = config.icon;
            const canAfford = acoinBalance >= plan.acoin_price;
            const hasActiveSubscription = !!currentSubscription;

            return (
              <Card
                key={plan.id}
                className={`p-5 relative overflow-hidden border-2 ${config.borderColor} ${hasActiveSubscription ? 'opacity-60' : ''} flex-shrink-0 w-[280px] md:w-[300px] snap-center`}
              >
                {/* Tier Badge */}
                <Badge className={`absolute right-3 top-3 bg-gradient-to-r ${config.gradient} text-white border-0 text-xs`}>
                  {config.label}
                </Badge>

                {/* Header with Icon */}
                <div className="text-center mb-4 pt-2">
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-br ${config.bgGradient} mb-3`}>
                    <TierIcon className={`h-6 w-6 ${config.textColor}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-1 bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-3xl font-bold">{plan.acoin_price}</span>
                    <span className="text-sm text-muted-foreground">ACoin</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.duration_days} days
                  </p>
                </div>

                <Separator className="my-4" />

                <ul className="space-y-2 mb-4 max-h-[180px] overflow-y-auto">
                  {plan.features.map((feature, i) => {
                    const FeatureIcon = featureIcons[feature] || Check;
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <FeatureIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${config.textColor}`} />
                        <span className="text-xs">{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  onClick={() => handlePurchase(plan.id, plan.acoin_price)}
                  disabled={!canAfford || purchasing === plan.id || hasActiveSubscription}
                  className={`w-full bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white border-0 text-sm`}
                  size="sm"
                >
                  {purchasing === plan.id ? (
                    'Processing...'
                  ) : hasActiveSubscription ? (
                    'Already Subscribed'
                  ) : !canAfford ? (
                    'Insufficient ACoin'
                  ) : (
                    `Get ${plan.name}`
                  )}
                </Button>

                {!canAfford && !hasActiveSubscription && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Need {plan.acoin_price - acoinBalance} more ACoin
                  </p>
                )}
                {hasActiveSubscription && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Wait until current subscription expires
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Tier Comparison Section */}
        <Card className="p-6 mt-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Compare Plans
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const tier = (plan.tier || 'silver') as keyof typeof tierConfig;
              const config = tierConfig[tier] || tierConfig.silver;
              return (
                <div key={plan.id} className={`p-4 rounded-lg border-2 ${config.borderColor} bg-gradient-to-br ${config.bgGradient}`}>
                  <h4 className={`font-bold text-lg mb-3 ${config.textColor}`}>{plan.name}</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => {
                      const FeatureIcon = featureIcons[feature] || Check;
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <FeatureIcon className={`h-4 w-4 ${config.textColor}`} />
                          <span>{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
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
              <span>Enjoy all premium features throughout your subscription period</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}