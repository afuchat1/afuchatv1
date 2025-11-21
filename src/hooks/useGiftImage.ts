import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GiftImageCache {
  [key: string]: string;
}

const imageCache: GiftImageCache = {};

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

      try {
        const { data, error: functionError } = await supabase.functions.invoke('generate-gift-image', {
          body: { giftName, emoji, rarity }
        });

        if (functionError) {
          console.error('Error generating gift image:', functionError);
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
    };

    generateImage();
  }, [giftId, giftName, emoji, rarity]);

  return { imageUrl, isLoading, error };
};
