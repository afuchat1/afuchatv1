import * as React from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  isVIP: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isPremium: false,
  isVIP: false,
  subscriptionEnd: null,
  checkSubscription: async () => {},
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isPremium, setIsPremium] = React.useState(false);
  const [isVIP, setIsVIP] = React.useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = React.useState<string | null>(null);

  const checkSubscription = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      const premiumProductId = "prod_TO5FgJrgCvSYuD";
      const vipProductId = "prod_TO5Ff17rDukZRi";
      
      setIsPremium(data.subscribed && (data.product_id === premiumProductId || data.product_id === vipProductId));
      setIsVIP(data.subscribed && data.product_id === vipProductId);
      setSubscriptionEnd(data.subscription_end);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [user]);

  React.useEffect(() => {
    // Function to record session and login
    const recordUserSession = async (session: Session) => {
      if (!session?.user || !session?.access_token) return;
      
      // Fire and forget - don't block user experience on tracking failures
      const userAgent = navigator.userAgent;
      const browser = userAgent.includes('Chrome') ? 'Chrome' 
        : userAgent.includes('Firefox') ? 'Firefox'
        : userAgent.includes('Safari') ? 'Safari'
        : 'Unknown';
      
      const deviceName = /Mobile|Android|iPhone|iPad/.test(userAgent) 
        ? 'Mobile Device' 
        : 'Desktop';

      // Record login history in background
      Promise.resolve(supabase.rpc('record_login_attempt', {
        p_user_id: session.user.id,
        p_success: true,
        p_user_agent: userAgent
      })).catch(err => console.warn('Login tracking failed:', err));

      // Create/update active session in background
      Promise.resolve(supabase.rpc('upsert_active_session', {
        p_user_id: session.user.id,
        p_session_token: session.access_token,
        p_device_name: deviceName,
        p_browser: browser,
        p_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
      })).catch(err => console.warn('Session tracking failed:', err));
    };

    // Set up auth state listener FIRST to catch all events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here to avoid deadlocks
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer any Supabase calls to avoid doing them inside the callback
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          setTimeout(() => {
            recordUserSession(session).catch((error) => {
              console.error('Error recording session from auth state change:', error);
            });
            checkSubscription();
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        // Defer Supabase RPC calls to avoid doing them directly in the promise chain
        setTimeout(() => {
          recordUserSession(session).catch((error) => {
            console.error('Error recording existing session:', error);
          });
          checkSubscription();
        }, 0);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  // Check subscription periodically
  React.useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return (
    <AuthContext.Provider value={{ user, session, loading, isPremium, isVIP, subscriptionEnd, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
