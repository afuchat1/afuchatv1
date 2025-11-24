import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePremiumStatus = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('expires_at, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setIsPremium(true);
          setExpiresAt(data.expires_at);
        } else {
          setIsPremium(false);
          setExpiresAt(null);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();

    // Subscribe to subscription changes
    const channel = supabase
      .channel('premium-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          checkPremiumStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { isPremium, loading, expiresAt };
};
