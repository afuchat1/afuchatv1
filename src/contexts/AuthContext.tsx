import * as React from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    
    // Function to record session and login
    const recordUserSession = async (session: Session) => {
      if (!session?.user || !session?.access_token || !isMounted) return;
      
      try {
        const userAgent = navigator.userAgent;
        const browser = userAgent.includes('Chrome') ? 'Chrome' 
          : userAgent.includes('Firefox') ? 'Firefox'
          : userAgent.includes('Safari') ? 'Safari'
          : 'Unknown';
        
        const deviceName = /Mobile|Android|iPhone|iPad/.test(userAgent) 
          ? 'Mobile Device' 
          : 'Desktop';

        // Record login history and session - fire and forget
        await Promise.all([
          supabase.rpc('record_login_attempt', {
            p_user_id: session.user.id,
            p_success: true,
            p_user_agent: userAgent
          }).then(),
          supabase.rpc('upsert_active_session', {
            p_user_id: session.user.id,
            p_session_token: session.access_token,
            p_device_name: deviceName,
            p_browser: browser,
            p_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
          }).then()
        ]);
      } catch {
        // Silent fail - don't block user experience
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          setTimeout(() => recordUserSession(session), 100);
          
          // Check for pending signup data from OAuth flow
          if (event === 'SIGNED_IN' && session) {
            const pendingSignupData = sessionStorage.getItem('pendingSignupData');
            
            if (pendingSignupData) {
              try {
                const signupData = JSON.parse(pendingSignupData);
                sessionStorage.removeItem('pendingSignupData');
                
                // Update profile with signup data
                supabase
                  .from('profiles')
                  .update({
                    handle: signupData.handle,
                    display_name: signupData.display_name,
                    country: signupData.country,
                    is_business_mode: signupData.is_business_mode,
                  })
                  .eq('id', session.user.id)
                  .then(({ error }) => {
                    if (error) {
                      console.error('Error updating profile with signup data:', error);
                    }
                  });
              } catch (e) {
                console.error('Error parsing pending signup data:', e);
              }
            }
            
            const currentPath = window.location.pathname;
            
            // Check if essential profile fields are complete
            supabase
              .from('profiles')
              .select('display_name, handle')
              .eq('id', session.user.id)
              .single()
              .then(({ data: profile, error }) => {
                if (error) {
                  console.error('Profile check error:', error);
                  // If profile doesn't exist yet, redirect to complete profile
                  if (currentPath === '/' || currentPath.startsWith('/auth')) {
                    window.location.href = '/complete-profile';
                  }
                  return;
                }

                const hasEssentialFields = profile?.display_name && profile?.handle;

                // If on landing/auth pages
                if (currentPath === '/' || currentPath.startsWith('/auth')) {
                  if (!hasEssentialFields) {
                    window.location.href = '/complete-profile';
                  } else {
                    window.location.href = '/home';
                  }
                } else if (currentPath !== '/complete-profile' && !hasEssentialFields) {
                  // Block access to other pages if essential fields incomplete
                  window.location.href = '/complete-profile';
                }
              });
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session) {
          setTimeout(() => recordUserSession(session), 100);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
