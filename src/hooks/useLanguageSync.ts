import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export const useLanguageSync = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    const syncLanguage = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (profile?.language && profile.language !== i18n.language) {
          i18n.changeLanguage(profile.language);
          
          // Set document direction for RTL languages
          if (profile.language === 'ar') {
            document.documentElement.dir = 'rtl';
          } else {
            document.documentElement.dir = 'ltr';
          }
        }
      } catch (error) {
        console.error('Error syncing language:', error);
      }
    };

    syncLanguage();
  }, [user, i18n]);
};
