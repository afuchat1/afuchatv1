import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OwlAvatarConfig, DEFAULT_AVATAR_CONFIG } from '@/types/avatar';

export const useUserAvatar = (userId: string | undefined) => {
  const [avatarConfig, setAvatarConfig] = useState<OwlAvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_avatars')
          .select('avatar_config')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching avatar:', error);
          setAvatarConfig(DEFAULT_AVATAR_CONFIG);
        } else if (data && data.avatar_config) {
          const config = data.avatar_config as Partial<OwlAvatarConfig>;
          setAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, ...config });
        } else {
          // No avatar found, use default
          setAvatarConfig(DEFAULT_AVATAR_CONFIG);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
        setAvatarConfig(DEFAULT_AVATAR_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();
  }, [userId]);

  const updateAvatar = async (newConfig: Partial<OwlAvatarConfig>) => {
    if (!userId) return false;

    const updatedConfig = { ...avatarConfig, ...newConfig };
    
    try {
      const { error } = await supabase
        .from('user_avatars')
        .upsert({
          user_id: userId,
          avatar_config: updatedConfig,
        });

      if (error) throw error;

      setAvatarConfig(updatedConfig);
      return true;
    } catch (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
  };

  return { avatarConfig, loading, updateAvatar };
};
