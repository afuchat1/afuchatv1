import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GiftImageCache {
  [key: string]: string;
}

const imageCache: GiftImageCache = {};
let requestQueue: Promise<void> = Promise.resolve();
let lastRequestTime = 0;
const MIN_REQUEST_DELAY = 1000; // 1 second between requests to avoid rate limiting

// Extend window type for toast debouncing
declare global {
  interface Window {
    _giftRateLimitToastShown?: boolean;
    _giftCreditsToastShown?: boolean;
  }
}

export const useGiftImage = (giftId: string, giftName: string, emoji: string, rarity: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const generateImage = async () => {
      // Check cache first
      if (imageCache[giftId]) {
        setImageUrl(imageCache[giftId]);
        setIsLoading(false);
        return;
      }

      // Add to queue with delay to prevent rate limiting
      requestQueue = requestQueue.then(async () => {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < MIN_REQUEST_DELAY) {
          await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_DELAY - timeSinceLastRequest));
        }
        
        lastRequestTime = Date.now();

        try {
          const { data, error: functionError } = await supabase.functions.invoke('generate-gift-image', {
            body: { giftName, emoji, rarity }
          });

          if (functionError) {
            // Handle rate limiting and credit errors
            if (functionError.message?.includes('429') || functionError.message?.includes('rate limit')) {
              console.log(`Rate limited for ${giftName}, showing emoji fallback`);
              // Show a toast once for rate limiting (debounced)
              if (!window._giftRateLimitToastShown) {
                window._giftRateLimitToastShown = true;
                toast.error('Gift images are being rate limited. Please wait a moment or upgrade for higher limits.');
                setTimeout(() => window._giftRateLimitToastShown = false, 10000);
              }
            } else if (functionError.message?.includes('402') || functionError.message?.includes('credits')) {
              console.log(`Out of credits for ${giftName}, showing emoji fallback`);
              // Show a toast once for credit depletion
              if (!window._giftCreditsToastShown) {
                window._giftCreditsToastShown = true;
                toast.error('AI credits depleted. Please add credits to your workspace in Settings to generate gift images.', {
                  duration: 10000
                });
                setTimeout(() => window._giftCreditsToastShown = false, 30000);
              }
            } else {
              console.error('Error generating gift image:', functionError);
            }
            setError(true);
            setIsLoading(false);
            return;
          }

          if (data?.error) {
            // Handle rate limit or other errors from edge function
            if (data.error.includes('rate limit')) {
              console.log(`Rate limited for ${giftName}, showing emoji fallback`);
              if (!window._giftRateLimitToastShown) {
                window._giftRateLimitToastShown = true;
                toast.error('Gift images are being rate limited. Please wait a moment or upgrade for higher limits.');
                setTimeout(() => window._giftRateLimitToastShown = false, 10000);
              }
            } else if (data.error.includes('credits') || data.error.includes('402')) {
              console.log(`Out of credits for ${giftName}, showing emoji fallback`);
              if (!window._giftCreditsToastShown) {
                window._giftCreditsToastShown = true;
                toast.error('AI credits depleted. Please add credits to your workspace in Settings to generate gift images.', {
                  duration: 10000
                });
                setTimeout(() => window._giftCreditsToastShown = false, 30000);
              }
            } else {
              console.error('Edge function error:', data.error);
            }
            setError(true);
            setIsLoading(false);
            return;
          }

          if (data?.imageUrl) {
            imageCache[giftId] = data.imageUrl;
            setImageUrl(data.imageUrl);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('Error generating gift image:', err);
          setError(true);
        } finally {
          setIsLoading(false);
        }
      });
    };

    generateImage();
  }, [giftId, giftName, emoji, rarity]);

  return { imageUrl, isLoading, error };
};
