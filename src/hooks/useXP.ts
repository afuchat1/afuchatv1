import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type XPAction = 
  | 'create_post'
  | 'create_reply'
  | 'give_reaction'
  | 'receive_reaction'
  | 'daily_login'
  | 'invite_user'
  | 'complete_profile'
  | 'use_ai';

const XP_VALUES: Record<XPAction, number> = {
  create_post: 5,
  create_reply: 2,
  give_reaction: 1,
  receive_reaction: 2,
  daily_login: 10,
  invite_user: 20,
  complete_profile: 15,
  use_ai: 5,
};

export const useXP = () => {
  const { user } = useAuth();

  const awardXP = useCallback(async (
    action: XPAction,
    metadata?: Record<string, any>,
    showToast: boolean = false
  ) => {
    if (!user) return;

    const xpAmount = XP_VALUES[action];

    try {
      const response = await fetch(
        'https://rhnsjqqtdzlkvqazfcbg.supabase.co/functions/v1/award-xp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            actionType: action,
            xpAmount,
            metadata,
          }),
        }
      );

      const data = await response.json();

      if (data.success && showToast) {
        toast.success(`+${xpAmount} XP earned! 🎉`, {
          description: `Total XP: ${data.xp}`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, [user]);

  return { awardXP };
};