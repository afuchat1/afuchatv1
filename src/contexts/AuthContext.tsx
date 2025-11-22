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
    // Function to record session and login
    const recordUserSession = async (session: Session) => {
      if (!session?.user || !session?.access_token) return;
      
      try {
        // Get browser info
        const userAgent = navigator.userAgent;
        const browser = userAgent.includes('Chrome') ? 'Chrome' 
          : userAgent.includes('Firefox') ? 'Firefox'
          : userAgent.includes('Safari') ? 'Safari'
          : 'Unknown';
        
        const deviceName = /Mobile|Android|iPhone|iPad/.test(userAgent) 
          ? 'Mobile Device' 
          : 'Desktop';

        // Record login history
        await supabase.rpc('record_login_attempt', {
          p_user_id: session.user.id,
          p_success: true,
          p_user_agent: userAgent
        });

        // Create/update active session
        await supabase.rpc('upsert_active_session', {
          p_user_id: session.user.id,
          p_session_token: session.access_token,
          p_device_name: deviceName,
          p_browser: browser,
          p_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
        });
      } catch (error) {
        console.error('Error recording session:', error);
      }
    };

    // Set up auth state listener FIRST to catch all events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Record session on sign in or token refresh
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          await recordUserSession(session);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Record session if one exists
      if (session) {
        await recordUserSession(session);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
