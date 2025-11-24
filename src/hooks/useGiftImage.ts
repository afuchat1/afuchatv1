import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGiftImage = (
  giftId: string,
  giftName: string,
  emoji: string,
  rarity: string
) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const generateImage = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const { data, error: functionError } = await supabase.functions.invoke(
          'generate-gift-image',
          {
            body: { giftId, giftName, emoji, rarity }
          }
        );

        if (!mounted) return;

        if (functionError) {
          console.error('Error generating gift image:', functionError);
          setError(true);
          setImageUrl(null);
          return;
        }

        if (data?.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          setError(true);
          setImageUrl(null);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error in useGiftImage:', err);
        setError(true);
        setImageUrl(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    generateImage();

    return () => {
      mounted = false;
    };
  }, [giftId, giftName, emoji, rarity]);

  return { imageUrl, isLoading, error };
};
