import { useMemo } from 'react';

// Simplified hook: no AI calls, just returns no image so UI uses emoji fallback
export const useGiftImage = (
  giftId: string,
  giftName: string,
  emoji: string,
  rarity: string
) => {
  // Keep a stable return shape so existing components keep working
  const result = useMemo(
    () => ({
      imageUrl: null as string | null,
      isLoading: false,
      error: false,
    }),
    [giftId, giftName, emoji, rarity]
  );

  return result;
};
