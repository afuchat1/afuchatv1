import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ProfileCompletionBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user || dismissed) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, country, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (profile && (!profile.phone_number || !profile.country || !profile.avatar_url || !profile.bio)) {
        setShow(true);
      }
    };

    checkProfile();
  }, [user, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem('profileCompletionDismissed', 'true');
  };

  const handleComplete = () => {
    navigate('/settings');
  };

  if (!show) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">
            Complete your profile (picture, bio, phone, country) to earn 100 Nexa rewards!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleComplete}
            className="text-primary hover:text-primary"
          >
            Complete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
