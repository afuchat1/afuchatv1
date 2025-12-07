import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Cache key for premium status
const PREMIUM_CACHE_KEY = 'afuchat_premium_status';

// Get cached premium status synchronously to prevent ad flash
const getCachedPremiumStatus = (userId?: string): boolean => {
  if (typeof window === 'undefined' || !userId) return false;
  try {
    const cached = sessionStorage.getItem(`${PREMIUM_CACHE_KEY}_${userId}`);
    if (cached) {
      const { isPremium, expiresAt } = JSON.parse(cached);
      // Check if cached data is still valid
      if (expiresAt && new Date(expiresAt) > new Date()) {
        return isPremium;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return false;
};

export const usePremiumStatus = (targetUserId?: string) => {
  const { user } = useAuth();
  
  // Use targetUserId if provided, otherwise fallback to current user
  const checkUserId = targetUserId || user?.id;
  
  // Initialize with cached value to prevent flash
  const [isPremium, setIsPremium] = useState(() => getCachedPremiumStatus(checkUserId));
  const [loading, setLoading] = useState(!getCachedPremiumStatus(checkUserId));
  const [expiresAt, setExpiresAt] = useState<string | null>(null);


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
          // Cache the premium status
          sessionStorage.setItem(`${PREMIUM_CACHE_KEY}_${checkUserId}`, JSON.stringify({
            isPremium: true,
            expiresAt: data.expires_at
          }));
        } else {
          setIsPremium(false);
          setExpiresAt(null);
          // Clear cache if not premium
          sessionStorage.removeItem(`${PREMIUM_CACHE_KEY}_${checkUserId}`);
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
