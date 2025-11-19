import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BusinessAccount {
  id: string;
  business_name: string;
  business_logo_url: string | null;
  business_description: string | null;
}

interface AccountModeContextType {
  isBusinessMode: boolean;
  setBusinessMode: (isBusinessMode: boolean) => Promise<void>;
  businessAccount: BusinessAccount | null;
  loading: boolean;
}

const AccountModeContext = createContext<AccountModeContextType>({
  isBusinessMode: false,
  setBusinessMode: async () => {},
  businessAccount: null,
  loading: true,
});

export const useAccountMode = () => useContext(AccountModeContext);

export function AccountModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isBusinessMode, setIsBusinessModeState] = useState<boolean>(false);
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsBusinessModeState(false);
      setBusinessAccount(null);
      setLoading(false);
      return;
    }

    const loadAccountData = async () => {
      try {
        // Get user's current account mode
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_business_mode')
          .eq('id', user.id)
          .single();

        if (profile) {
          setIsBusinessModeState(profile.is_business_mode || false);
        }

        // Check if user has business profile set up
        const { data: businessProfile } = await supabase
          .from('profiles')
          .select('id, business_name, business_logo_url, business_description')
          .eq('id', user.id)
          .single();

        if (businessProfile?.business_name) {
          setBusinessAccount(businessProfile);
        } else {
          setBusinessAccount(null);
        }
      } catch (error) {
        console.error('Error loading account data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, [user]);

  const setBusinessMode = async (mode: boolean) => {
    if (!user) return;

    if (mode && !businessAccount) {
      toast.error('You need to set up your business profile first');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_business_mode: mode })
        .eq('id', user.id);

      if (error) throw error;

      setIsBusinessModeState(mode);
      toast.success(`Switched to ${mode ? 'business' : 'personal'} account`);
    } catch (error) {
      console.error('Error switching account mode:', error);
      toast.error('Failed to switch account mode');
    }
  };

  return (
    <AccountModeContext.Provider 
      value={{ 
        isBusinessMode, 
        setBusinessMode, 
        businessAccount,
        loading 
      }}
    >
      {children}
    </AccountModeContext.Provider>
  );
}
