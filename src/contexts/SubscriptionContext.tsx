import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type SubscriptionTier = 'basic' | 'premium' | 'vip';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  loading: boolean;
  subscriptionEnd: string | null;
  refreshSubscription: () => Promise<void>;
  isPremium: boolean;
  isVIP: boolean;
}

const SubscriptionContext = React.createContext<SubscriptionContextType>({
  tier: 'basic',
  loading: true,
  subscriptionEnd: null,
  refreshSubscription: async () => {},
  isPremium: false,
  isVIP: false,
});

export const useSubscription = () => {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [tier, setTier] = React.useState<SubscriptionTier>('basic');
  const [loading, setLoading] = React.useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = React.useState<string | null>(null);

  const checkSubscription = React.useCallback(async () => {
    if (!user || !session) {
      setTier('basic');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setTier('basic');
      } else {
        setTier(data.tier || 'basic');
        setSubscriptionEnd(data.subscription_end || null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setTier('basic');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  React.useEffect(() => {
    checkSubscription();

    // Refresh subscription status every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const isPremium = tier === 'premium' || tier === 'vip';
  const isVIP = tier === 'vip';

  return (
    <SubscriptionContext.Provider 
      value={{ 
        tier, 
        loading, 
        subscriptionEnd, 
        refreshSubscription: checkSubscription,
        isPremium,
        isVIP
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
