import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePremiumStatus = (targetUserId?: string) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Use targetUserId if provided, otherwise fallback to current user
  const checkUserId = targetUserId || user?.id;

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!checkUserId) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('expires_at, is_active')
          .eq('user_id', checkUserId)
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
      .channel(`premium-status-${checkUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${checkUserId}`,
        },
        () => {
          checkPremiumStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkUserId]);

  return { isPremium, loading, expiresAt };
};
