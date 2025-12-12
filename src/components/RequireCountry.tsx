import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomLoader } from '@/components/ui/CustomLoader';

interface RequireCountryProps {
  children: ReactNode;
}

export const RequireCountry = ({ children }: RequireCountryProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasCountry, setHasCountry] = useState(true);

  useEffect(() => {
    const checkCountry = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      // Check cache first
      const cacheKey = `profile_country_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const { hasCountry: cachedHasCountry, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setHasCountry(cachedHasCountry);
          setChecking(false);
          return;
        }
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single();

        const countrySet = !!(profile?.country && profile.country.trim() !== '');
        setHasCountry(countrySet);
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          hasCountry: countrySet,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error checking country:', error);
        setHasCountry(true); // Don't block on error
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading) {
      checkCountry();
    }
  }, [user, authLoading]);

  // Still loading auth or checking country
  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader size="lg" />
      </div>
    );
  }

  // Not logged in - allow access (public pages)
  if (!user) {
    return <>{children}</>;
  }

  // User is logged in but has no country - redirect to complete profile
  if (!hasCountry) {
    // Avoid redirect loop
    if (location.pathname === '/complete-profile') {
      return <>{children}</>;
    }
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};